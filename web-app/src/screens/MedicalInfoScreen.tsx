import React, { useState } from "react";
import "./MedicalInfoScreen.css";

interface UploadedDocument {
  id: number;
  name: string;
  url: string;
}

interface ChatMessage {
  id: number;
  sender: "User" | "Agent";
  text: string;
}

export default function DocumentChatScreen() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const filesArray = Array.from(event.target.files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setUploadedDocs((prev) => [...prev, ...filesArray]);
    setSelectedDoc(filesArray[0]);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now(),
      sender: "User",
      text: newMessage,
    };

    setChatMessages((prev) => [...prev, msg]);
    setNewMessage("");

    // TODO MindStudio agent response here
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
            <span>Upload Documents</span>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="file-upload-input"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
          </label>
        </div>

        {uploadedDocs.length > 0 && (
          <ul className="documents-list">
            {uploadedDocs.map((doc) => (
              <li
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`document-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
              >
                <div className="document-item-name">📄 {doc.name}</div>
              </li>
            ))}
          </ul>
        )}

        {selectedDoc ? (
          <iframe
            src={selectedDoc.url}
            title={selectedDoc.name}
            className="document-preview"
          />
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
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-input-section">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="Ask a question about your documents..."
            className="chat-input"
            disabled={uploadedDocs.length === 0}
          />
          <button
            onClick={handleSendMessage}
            className="send-button"
            disabled={!newMessage.trim() || uploadedDocs.length === 0}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
