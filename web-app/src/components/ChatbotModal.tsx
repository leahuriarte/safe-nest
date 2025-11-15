import { useState, useRef } from "react";
import "./ChatbotModal.css";

export default function ChatbotModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I can help you find OB-GYN clinics near you." },
  ]);
  const [input, setInput] = useState("");

  // Position & size state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 350, height: 500 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Dragging
  const startDrag = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...position };

    const onMouseMove = (e: MouseEvent) => {
      setPosition({
        x: startPos.x + (e.clientX - startX),
        y: startPos.y + (e.clientY - startY),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Resizing
  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...size };

    const onMouseMove = (e: MouseEvent) => {
      setSize({
        width: Math.max(200, startSize.width + (e.clientX - startX)),
        height: Math.max(200, startSize.height + (e.clientY - startY)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleSend = () => {
    if (!input) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
      { sender: "bot", text: "Searching clinics near you... (chatbot coming soon)" },
    ]);
    setInput("");
  };

  return (
    <div
      ref={modalRef}
      className="chatbot-modal"
      style={{
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
      }}
    >
      <div className="chatbot-header" onMouseDown={startDrag}>
        Clinic Finder Chat
        <button onClick={onClose}>×</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.sender}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>

      <div className="resize-handle" onMouseDown={startResize}></div>
    </div>
  );
}
