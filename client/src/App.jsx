import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const MIN_CHARS = 100;
const MAX_CHARS_DISPLAY = 150;

function App() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('summarize');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('abstractor_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  const saveToHistory = (originalText, summaryText, source = 'text') => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      originalText: originalText.substring(0, 500),
      summary: summaryText,
      source,
    };

    const updatedHistory = [newEntry, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('abstractor_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('abstractor_history');
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setError('');
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (selectedFile) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.txt', '.docx'];
    
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, TXT, or DOCX file only.');
      return;
    }

    if (selectedFile.size > 16 * 1024 * 1024) {
      setError('File size must be less than 16MB.');
      return;
    }

    setFile(selectedFile);
    setText('');
    setError('');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSummarize = async () => {
    setError('');
    setSummary('');
    setStats(null);

    if (!file && text.length < MIN_CHARS) {
      setError(`Your text needs at least ${MIN_CHARS} characters for a meaningful summary. You currently have ${text.length} characters. Try adding more detail to your content!`);
      return;
    }

    setLoading(true);

    try {
      let response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await axios.post('/api/summarize/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
      } else {
        response = await axios.post('/api/summarize', { text }, {
          timeout: 120000,
        });
      }

      if (response.data.success) {
        setSummary(response.data.summary);
        setStats({
          originalLength: response.data.original_length,
          summaryLength: response.data.summary_length,
          reduction: Math.round((1 - response.data.summary_length / response.data.original_length) * 100),
        });
        saveToHistory(
          file ? `[File: ${file.name}]` : text,
          response.data.summary,
          file ? 'file' : 'text'
        );
      } else {
        setError(response.data.error || 'An error occurred during summarization.');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === 'ECONNABORTED') {
        setError('The request timed out. Please try with a shorter text or try again later.');
      } else {
        setError('Failed to connect to the summarization service. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
    setError('');
    setFile(null);
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCharCountStatus = () => {
    if (file) return 'valid';
    if (text.length >= MIN_CHARS) return 'valid';
    if (text.length > 0) return 'warning';
    return '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <a href="/" className="logo">
            <div className="logo-icon">A</div>
            <span className="logo-text">Abstractor</span>
          </a>
          <nav>
            <button 
              className={`nav-btn ${activeTab === 'summarize' ? 'active' : ''}`}
              onClick={() => setActiveTab('summarize')}
            >
              Summarize
            </button>
            <button 
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      <main>
        {activeTab === 'summarize' ? (
          <>
            <div className="hero">
              <h1>Transform Text into Clarity</h1>
              <p>
                Abstractor uses advanced AI to distill your documents and text into 
                concise, meaningful summaries. Paste text or upload a file to get started.
              </p>
            </div>

            <div className="summarizer-container">
              <div className="input-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <span>📝</span> Your Content
                  </h2>
                  <span className={`char-count ${getCharCountStatus()}`}>
                    {file 
                      ? `📎 ${file.name}` 
                      : `${text.length} / ${MIN_CHARS} min characters`}
                  </span>
                </div>

                <textarea
                  value={text}
                  onChange={handleTextChange}
                  placeholder={`Enter your text here (minimum ${MIN_CHARS} characters for summarization)...`}
                  disabled={!!file || loading}
                />

                <div 
                  className={`file-upload ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="file-upload-icon">📄</div>
                  <div className="file-upload-text">
                    <strong>Click to upload</strong> or drag and drop
                  </div>
                  <div className="file-upload-hint">PDF, TXT, or DOCX (max 16MB)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {file && (
                  <div className="file-info">
                    <span className="file-info-name">
                      <span>✓</span> {file.name}
                    </span>
                    <button className="remove-file" onClick={removeFile}>×</button>
                  </div>
                )}

                {error && (
                  <div className="validation-message">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <div className="actions">
                  <button 
                    className="btn btn-primary"
                    onClick={handleSummarize}
                    disabled={loading || (!file && text.length < MIN_CHARS)}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Abstracting...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Summarize with Abstractor
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="output-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <span>🎯</span> Summary
                  </h2>
                </div>

                {summary ? (
                  <>
                    <div className="summary-result">{summary}</div>
                    {stats && (
                      <div className="summary-stats">
                        <div className="stat">
                          <span className="stat-label">Original</span>
                          <span className="stat-value">{stats.originalLength.toLocaleString()} chars</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Summary</span>
                          <span className="stat-value">{stats.summaryLength.toLocaleString()} chars</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Reduction</span>
                          <span className="stat-value">{stats.reduction}%</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-text">
                      Your summary will appear here after processing
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="history-section">
            <div className="history-header">
              <h2 className="history-title">
                <span>📚</span> Summary History
              </h2>
              {history.length > 0 && (
                <button className="clear-history" onClick={clearHistory}>
                  Clear All
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="history-list">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="history-item"
                    onClick={() => setSelectedHistory(item)}
                  >
                    <div className="history-item-header">
                      <span className="history-item-date">{formatDate(item.date)}</span>
                      <span className="history-item-badge">
                        {item.source === 'file' ? '📎 File' : '📝 Text'}
                      </span>
                    </div>
                    <p className="history-item-preview">{item.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="history-empty">
                <p>No summaries yet. Start by summarizing some text or uploading a document!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedHistory && (
        <div className="modal-overlay" onClick={() => setSelectedHistory(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Summary Details</h3>
              <button className="modal-close" onClick={() => setSelectedHistory(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <p className="modal-section-title">Date</p>
                <p className="modal-section-content">{formatDate(selectedHistory.date)}</p>
              </div>
              <div className="modal-section">
                <p className="modal-section-title">Original Input</p>
                <p className="modal-section-content">{selectedHistory.originalText}</p>
              </div>
              <div className="modal-section">
                <p className="modal-section-title">Summary</p>
                <p className="modal-section-content">{selectedHistory.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p className="footer-text">
          Powered by <strong>Abstractor</strong> — AI-driven abstractive summarization
        </p>
      </footer>
    </div>
  );
}

export default App;
