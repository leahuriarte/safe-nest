import { useState, useRef, useEffect } from "react";
import "./ChatbotModal.css";
import { clinicChatService } from "../services/clinicChatService";
import ReactMarkdown from 'react-markdown';

interface ChatbotModalProps {
  onClose: () => void;
  onSearchAddress?: (address: string) => void;
  userLocation?: string;
}

export default function ChatbotModal({ onClose, onSearchAddress, userLocation }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: "bot", text: "Hi! I can help you find reproductive health clinics near you. Just ask me about clinics in your area, or tell me what services you need." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  // Set location when component mounts or userLocation changes
  useEffect(() => {
    if (userLocation) {
      clinicChatService.setLocation(userLocation);
    }
  }, [userLocation]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);

    try {
      const response = await clinicChatService.sendMessage(userMessage);
      setMessages((prev) => [...prev, { sender: "bot", text: response }]);
    } catch (error) {
      console.error('Error getting clinic recommendations:', error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddressClick = (address: string) => {
    if (onSearchAddress) {
      onSearchAddress(address);
    }
  };

  // Extract clickable addresses from bot messages
  const renderMessage = (message: { sender: string; text: string }, index: number) => {
    if (message.sender === 'bot') {
      const addresses = clinicChatService.extractAddresses(message.text);

      return (
        <div key={index} className={`message ${message.sender}`}>
          <ReactMarkdown
            components={{
              // Make addresses clickable
              p: ({ children }) => {
                const text = String(children);
                if (text.includes('📍')) {
                  const addressMatch = text.match(/📍\s*(.+)/);
                  if (addressMatch && onSearchAddress) {
                    const address = addressMatch[1].trim();
                    return (
                      <p>
                        📍{' '}
                        <button
                          className="address-link"
                          onClick={() => handleAddressClick(address)}
                          title="Click to search this address on the map"
                        >
                          {address}
                        </button>
                      </p>
                    );
                  }
                }
                return <p>{children}</p>;
              },
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div key={index} className={`message ${message.sender}`}>
        {message.text}
      </div>
    );
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
        {messages.map((m, i) => renderMessage(m, i))}
        {isLoading && (
          <div className="message bot">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Ask about clinics in your area..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      <div className="resize-handle" onMouseDown={startResize}></div>
    </div>
  );
}
