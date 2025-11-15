import React, { useState } from "react";

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
    <div
      style={{
        display: "flex",
        height: "calc(100dvh - 45px)",
        width: "100%",
        padding: "8px",
        paddingBottom: "60px",
        boxSizing: "border-box",
        gap: "8px",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          padding: "12px",
          overflow: "hidden",
        }}
      >
        <h2 style={{ margin: "0 0 8px" }}>Uploaded Documents</h2>

        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          style={{ marginBottom: "12px" }}
        />

        <ul style={{ listStyle: "none", padding: 0, maxHeight: "120px", overflowY: "auto" }}>
          {uploadedDocs.map((doc) => (
            <li
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              style={{
                padding: "6px 8px",
                marginBottom: "4px",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor:
                  selectedDoc?.id === doc.id ? "#dceeff" : "transparent",
              }}
            >
              {doc.name}
            </li>
          ))}
        </ul>

        {selectedDoc ? (
          <iframe
            src={selectedDoc.url}
            title={selectedDoc.name}
            style={{ flex: 1, borderRadius: "4px", border: "1px solid #ccc" }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#666",
            }}
          >
            No document selected
          </div>
        )}
      </div>

      {/* RIGHT SIDE CHAT PANEL */}
      <div
        style={{
          flex: 0.45,
          display: "flex",
          flexDirection: "column",
          padding: "12px",
          overflow: "hidden",
        }}
      >
        <h2 style={{ margin: "0 0 8px" }}>Chat</h2>

        {/* Chat messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #d196da",
            borderRadius: "8px",
            padding: "8px",
            backgroundColor: "#fafafa",
            marginBottom: "12px",
          }}
        >
          {chatMessages.length === 0 && <p>No messages yet.</p>}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                textAlign: msg.sender === "User" ? "right" : "left",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "16px",
                  backgroundColor:
                    msg.sender === "User" ? "#d196da" : "#d196da",
                  color: msg.sender === "User" ? "#fff" : "#000",
                  maxWidth: "75%",
                  wordWrap: "break-word",
                }}
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>

        {/* INPUT + ARROW SEND */}
        <div style={{ position: "relative" }}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="Type a message..."
            style={{
              width: "100%",
              height: "70px",
              padding: "10px 40px 10px 10px", // space for arrow
              borderRadius: "10px",
              border: "1px solid #ccc",
              resize: "none",
              fontSize: "0.95rem",
            }}
          />

          {/* SEND ARROW BUTTON */}
          <button
            onClick={handleSendMessage}
            style={{
              position: "absolute",
              right: "10px",
              bottom: "10px",
              background: "#d196da",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
