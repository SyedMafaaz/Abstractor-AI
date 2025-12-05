import os
import re
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document
import io

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx'}

HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream):
    try:
        pdf_reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_stream):
    try:
        doc = Document(file_stream)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from DOCX: {str(e)}")

def extract_text_from_txt(file_stream):
    try:
        content = file_stream.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        return content.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from TXT: {str(e)}")

def chunk_text(text, max_chunk_size=1000):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_chunk_size:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks if chunks else [text[:max_chunk_size]]

def abstractive_summarize(text, max_length=150, min_length=40):
    hf_token = os.environ.get('HUGGINGFACE_API_TOKEN')
    
    if hf_token:
        headers = {"Authorization": f"Bearer {hf_token}"}
        
        chunks = chunk_text(text, max_chunk_size=1000)
        summaries = []
        
        for chunk in chunks[:5]:
            payload = {
                "inputs": chunk,
                "parameters": {
                    "max_length": max_length,
                    "min_length": min_length,
                    "do_sample": False
                }
            }
            
            try:
                response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=60)
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        summaries.append(result[0].get('summary_text', ''))
                elif response.status_code == 503:
                    return extractive_summarize(text)
                else:
                    return extractive_summarize(text)
            except requests.exceptions.Timeout:
                return extractive_summarize(text)
            except Exception:
                return extractive_summarize(text)
        
        if summaries:
            combined = " ".join(summaries)
            return combined
    
    return extractive_summarize(text)

def extractive_summarize(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if len(sentences) <= 3:
        return " ".join(sentences)
    
    word_freq = {}
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
                  'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
                  'those', 'it', 'its', 'they', 'them', 'their', 'which', 'who', 'whom'}
    
    for word in words:
        if word not in stop_words:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    sentence_scores = []
    for i, sentence in enumerate(sentences):
        score = 0
        sentence_words = re.findall(r'\b[a-zA-Z]{3,}\b', sentence.lower())
        for word in sentence_words:
            score += word_freq.get(word, 0)
        if len(sentence_words) > 0:
            score = score / len(sentence_words)
        if i == 0:
            score *= 1.5
        sentence_scores.append((i, sentence, score))
    
    sentence_scores.sort(key=lambda x: x[2], reverse=True)
    num_sentences = max(3, len(sentences) // 4)
    top_sentences = sorted(sentence_scores[:num_sentences], key=lambda x: x[0])
    
    summary = " ".join([s[1] for s in top_sentences])
    return summary

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text'].strip()
        
        if len(text) < 100:
            return jsonify({
                'error': 'Text is too short. Please provide at least 100 characters for meaningful summarization.',
                'current_length': len(text),
                'required_length': 100
            }), 400
        
        summary = abstractive_summarize(text)
        
        return jsonify({
            'success': True,
            'summary': summary,
            'original_length': len(text),
            'summary_length': len(summary)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize/file', methods=['POST'])
def summarize_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload PDF, TXT, or DOCX files only.'}), 400
        
        filename = secure_filename(str(file.filename))
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        file_stream = io.BytesIO(file.read())
        
        if file_ext == 'pdf':
            text = extract_text_from_pdf(file_stream)
        elif file_ext == 'docx':
            text = extract_text_from_docx(file_stream)
        elif file_ext == 'txt':
            text = extract_text_from_txt(file_stream)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        if not text:
            return jsonify({'error': 'Could not extract text from the file. The file may be empty or corrupted.'}), 400
        
        if len(text) < 100:
            return jsonify({
                'error': 'Extracted text is too short. Please provide a document with at least 100 characters.',
                'current_length': len(text),
                'required_length': 100
            }), 400
        
        summary = abstractive_summarize(text)
        
        return jsonify({
            'success': True,
            'summary': summary,
            'original_length': len(text),
            'summary_length': len(summary),
            'filename': filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Abstractor API'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
