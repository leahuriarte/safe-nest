import React, { useState, useEffect } from "react";
import "./MedicalInfoScreen.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  initializeGemini,
  createDocumentChunks,
  generateRAGResponse,
} from "../utils/documentRAG";
import type { DocumentChunk, RAGResponse } from "../utils/documentRAG";

interface UploadedDocument {
  id: number;
  name: string;
  url: string;
  file: File;
  chunks?: DocumentChunk[];
}

interface ChatMessage {
  id: number;
  sender: "User" | "Agent";
  text: string;
  sources?: {
    text: string;
    pageNumber: number;
    documentName: string;
  }[];
}

export default function DocumentChatScreen() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Gemini on mount
  useEffect(() => {
    initializeGemini();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    setIsProcessing(true);

    try {
      const filesArray = await Promise.all(
        Array.from(event.target.files).map(async (file, index) => {
          try {
            const chunks = await createDocumentChunks(file);
            return {
              id: Date.now() + index,
              name: file.name,
              url: URL.createObjectURL(file),
              file,
              chunks,
            };
          } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            alert(`Failed to process ${file.name}. Only PDF and TXT files are supported.`);
            return null;
          }
        })
      );

      const validFiles = filesArray.filter((f) => f !== null) as UploadedDocument[];
      setUploadedDocs((prev) => [...prev, ...validFiles]);
      if (validFiles.length > 0) {
        setSelectedDoc(validFiles[0]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: "User",
      text: newMessage,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage("");
    setIsProcessing(true);

    try {
      // Collect all chunks from all documents
      const allChunks: DocumentChunk[] = [];
      uploadedDocs.forEach((doc) => {
        if (doc.chunks) {
          allChunks.push(...doc.chunks);
        }
      });

      if (allChunks.length === 0) {
        const errorMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: "Agent",
          text: "Please upload at least one document first.",
        };
        setChatMessages((prev) => [...prev, errorMsg]);
        setIsProcessing(false);
        return;
      }

      // Generate RAG response
      const response: RAGResponse = await generateRAGResponse(newMessage, allChunks);

      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "Agent",
        text: response.answer,
        sources: response.sources,
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "Agent",
        text: "Sorry, I encountered an error processing your question. Please try again.",
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const onKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="document-helper-container">
      {/* LEFT PANEL - DOCUMENTS */}
      <div className="documents-panel">
        <h2 className="documents-header">Documents</h2>

        <div className="file-upload-section">
          <label className="file-upload-label">
            <span>📄</span>
            <span>{isProcessing ? "Processing..." : "Upload Documents"}</span>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="file-upload-input"
              accept=".pdf,.txt"
              disabled={isProcessing}
            />
          </label>
        </div>

        {uploadedDocs.length > 0 && (
          <ul className="documents-list">
            {uploadedDocs.map((doc) => (
              <li
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`document-item ${selectedDoc?.id === doc.id ? "selected" : ""}`}
              >
                <div className="document-item-name">
                  📄 {doc.name}
                  {doc.chunks && (
                    <span className="chunk-count"> ({doc.chunks.length} chunks)</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedDoc ? (
          selectedDoc.file.type === "application/pdf" ? (
            <iframe src={selectedDoc.url} title={selectedDoc.name} className="document-preview" />
          ) : (
            <div className="text-preview">
              <p>Text file: {selectedDoc.name}</p>
              <p>Processed into {selectedDoc.chunks?.length} chunks</p>
            </div>
          )
        ) : (
          <div className="empty-preview">
            <div className="empty-preview-icon">📄</div>
            <div className="empty-preview-text">
              {uploadedDocs.length === 0
                ? "Upload documents to get started"
                : "Select a document to preview"}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - CHAT */}
      <div className="chat-panel">
        <h2 className="chat-header">Ask Questions</h2>

        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-chat-icon">💬</div>
              <div className="empty-chat-text">
                Upload a document and ask questions about it
              </div>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender.toLowerCase()}`}>
                <div className={`message-bubble ${msg.sender.toLowerCase()}`}>
                  <div className="message-text">
                    {msg.sender === 'Agent' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom styling for markdown elements
                          h1: ({ children }) => <h1 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#2c3e50' }}>{children}</h1>,
                          h2: ({ children }) => <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#2c3e50' }}>{children}</h2>,
                          h3: ({ children }) => <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#2c3e50' }}>{children}</h3>,
                          p: ({ children }) => <p style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem' }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                          blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #d196da', paddingLeft: '1rem', margin: '0.75rem 0', fontStyle: 'italic', color: '#6c757d' }}>{children}</blockquote>,
                          code: ({ children }) => <code style={{ backgroundColor: '#f8f9fa', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.9rem' }}>{children}</code>,
                          strong: ({ children }) => <strong style={{ color: '#2c3e50' }}>{children}</strong>,
                          em: ({ children }) => <em style={{ color: '#6c757d' }}>{children}</em>
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="message-sources">
                      <div className="sources-header">📚 Sources:</div>
                      {msg.sources.map((source, idx) => (
                        <div key={idx} className="source-item">
                          <strong>
                            {source.documentName} (Page {source.pageNumber})
                          </strong>
                          <div className="source-text">{source.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="chat-message agent">
              <div className="message-bubble agent">
                <div className="typing-indicator">Thinking...</div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-section">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="Ask a question about your documents..."
            className="chat-input"
            disabled={uploadedDocs.length === 0 || isProcessing}
          />
          <button
            onClick={handleSendMessage}
            className="send-button"
            disabled={!newMessage.trim() || uploadedDocs.length === 0 || isProcessing}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
