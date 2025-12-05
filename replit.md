# Abstractor - AI Text Summarization Tool

## Overview
Abstractor is an AI-powered abstractive text summarization web application that uses Hugging Face Transformers (BART model) to generate concise summaries from documents and text.

## Project Structure
```
/
├── backend/
│   └── app.py          # Flask API server with summarization endpoints
├── client/
│   ├── src/
│   │   ├── App.jsx     # Main React component
│   │   ├── main.jsx    # React entry point
│   │   └── index.css   # Global styles
│   ├── public/
│   │   └── favicon.svg # App favicon
│   └── index.html      # HTML template
├── vite.config.js      # Vite configuration
├── package.json        # Node.js dependencies
└── pyproject.toml      # Python dependencies
```

## Features
- **Abstractive Summarization**: Uses Hugging Face BART model for AI-powered summarization
- **File Upload**: Supports PDF, TXT, and DOCX document uploads
- **Text Input**: Direct text input with 100 character minimum
- **History**: Browser-based localStorage history of past summaries
- **Modern UI**: Responsive design with hover animations and smooth transitions

## Tech Stack
- **Backend**: Flask (Python) with Flask-CORS
- **Frontend**: React + Vite with JSX
- **AI/NLP**: Hugging Face Transformers (BART-large-cnn) via Inference API
- **File Processing**: PyPDF2, python-docx

## API Endpoints
- `POST /api/summarize` - Summarize text input
- `POST /api/summarize/file` - Summarize uploaded document
- `GET /api/health` - Health check endpoint

## Configuration
- Backend runs on port 8000
- Frontend runs on port 5000 with proxy to backend
- Set `HUGGINGFACE_API_TOKEN` secret for AI-powered summarization

## Development
- Backend: `python backend/app.py`
- Frontend: `npm run dev`

## Recent Changes
- Initial build: December 2024
- Rebranded from "AI Summarizer" to "Abstractor"
- Added file upload support (PDF, TXT, DOCX)
- Implemented browser-based history with localStorage
- Modern, minimalist UI with animations
