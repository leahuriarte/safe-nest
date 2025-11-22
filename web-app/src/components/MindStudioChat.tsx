import React, { useState, useEffect, useRef } from 'react';
import { sendToMindStudio, generateSessionId, generateUserId } from '../utils/mindstudio';
import type { MindStudioRequest, MindStudioResponse } from '../utils/mindstudio';
import './MindStudioChat.css';

interface ChatMessage {
  id: number;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface MindStudioChatProps {
  className?: string;
  placeholder?: string;
  title?: string;
}

export default function MindStudioChat({ 
  className = '', 
  placeholder = 'Ask your MindStudio agent...',
  title = 'MindStudio Agent'
}: MindStudioChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const [userId] = useState(() => generateUserId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: Date.now() + 1,
      sender: 'agent',
      text: 'Thinking...',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const request: MindStudioRequest = {
        message: userMessage.text,
        sessionId,
        userId
      };

      const response: MindStudioResponse = await sendToMindStudio(request);

      // Remove loading message and add actual response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const agentMessage: ChatMessage = {
          id: Date.now() + 2,
          sender: 'agent',
          text: response.response,
          timestamp: new Date()
        };
        return [...withoutLoading, agentMessage];
      });

    } catch (error) {
      console.error('Error sending message to MindStudio:', error);
      
      // Remove loading message and add error message
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        const errorMessage: ChatMessage = {
          id: Date.now() + 2,
          sender: 'agent',
          text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        };
        return [...withoutLoading, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`mindstudio-chat ${className}`}>
      <div className="mindstudio-chat-header">
        <h3>{title}</h3>
        <div className="session-info">
          <small>Session: {sessionId.split('_')[1]}</small>
        </div>
      </div>

      <div className="mindstudio-chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-state">
            <div className="empty-chat-icon">🤖</div>
            <p>Start a conversation with your MindStudio agent</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender} ${message.isLoading ? 'loading' : ''}`}
            >
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mindstudio-chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          rows={2}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}