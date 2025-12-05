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
- **Summary Length Options**: Choose between Short, Medium, or Long summaries
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
- `POST /api/summarize` - Summarize text input (accepts `text` and `length` parameters)
- `POST /api/summarize/file` - Summarize uploaded document (accepts `file` and `length` form data)
- `GET /api/health` - Health check endpoint

## Configuration
- Backend runs on port 8000
- Frontend runs on port 5000 with proxy to backend
- Set `HUGGINGFACE_API_TOKEN` environment variable for AI-powered summarization

## Development
- Backend: `python backend/app.py`
- Frontend: `npm run dev`

## Export & Installation Instructions

If you export this app to run on another machine, follow these steps:

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Step 1: Clone/Download the Project
```bash
# If using git
git clone <your-repo-url>
cd abstractor
```

### Step 2: Install Python Dependencies
```bash
pip install flask flask-cors pypdf2 python-docx requests gunicorn
```

Or using the requirements.txt file:
```bash
pip install -r requirements.txt
```

### Step 3: Install Node.js Dependencies
```bash
npm install
```

### Step 4: Set Environment Variables
```bash
# For AI-powered summarization (get free token from https://huggingface.co/settings/tokens)
export HUGGINGFACE_API_TOKEN=your_token_here

# On Windows (Command Prompt):
set HUGGINGFACE_API_TOKEN=your_token_here

# On Windows (PowerShell):
$env:HUGGINGFACE_API_TOKEN="your_token_here"
```

### Step 5: Run the Application

**Development Mode (Two Terminals):**
```bash
# Terminal 1 - Start Backend API
python backend/app.py

# Terminal 2 - Start Frontend Dev Server
npm run dev
```

**Production Mode:**
```bash
# Build the frontend
npm run build

# Start backend with Gunicorn (Linux/Mac)
gunicorn --bind 0.0.0.0:8000 --chdir backend app:app

# Or start backend with Python directly
python backend/app.py
```

### Complete Command Summary

```bash
# Full setup from scratch
git clone <your-repo-url>
cd abstractor

# Install all dependencies
pip install flask flask-cors pypdf2 python-docx requests gunicorn
npm install

# Set API token (optional but recommended for AI features)
export HUGGINGFACE_API_TOKEN=your_token_here

# Run development servers
python backend/app.py &    # Start backend (runs in background)
npm run dev               # Start frontend
```

### Requirements Files

**Python (requirements.txt):**
```
flask>=3.0.0
flask-cors>=4.0.0
pypdf2>=3.0.0
python-docx>=1.0.0
requests>=2.31.0
gunicorn>=21.0.0
```

**Node.js (package.json) - Already included in project**

### Ports Used
- Frontend: `http://localhost:5000`
- Backend API: `http://localhost:8000`

### Notes
- The frontend proxies API requests to the backend automatically
- Without the Hugging Face API token, the app uses extractive summarization (still functional but less advanced)
- Summary length options: Short (brief), Medium (balanced), Long (detailed)

## Recent Changes
- December 2024: Added summary length selection (Short/Medium/Long)
- December 2024: Enhanced UI with modern styling and animations
- December 2024: Initial build with file upload support
- December 2024: Rebranded to "Abstractor"
