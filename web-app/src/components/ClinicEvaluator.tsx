import { useState } from 'react'
import { clinicChatService } from '../services/clinicChatService'
import './ClinicEvaluator.css'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ClinicEvaluatorProps {
  clinicName?: string
  clinicAddress?: string
  onClose?: () => void
}

export default function ClinicEvaluator({
  clinicName,
  clinicAddress,
  onClose
}: ClinicEvaluatorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-evaluate clinic if provided
  const handleEvaluateClinic = async () => {
    if (!clinicName) return

    setIsLoading(true)
    setError(null)

    const evaluationPrompt = `Please provide information about ${clinicName}${clinicAddress ? ` located at ${clinicAddress}` : ''}. Include details about their services, patient reviews if known, and any important information for pregnant individuals seeking care.`

    try {
      const userMessage: Message = {
        role: 'user',
        content: `Please evaluate ${clinicName}`,
        timestamp: Date.now()
      }

      const response = await clinicChatService.sendMessage(evaluationPrompt)

      setMessages([
        userMessage,
        {
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        }
      ])
    } catch (err) {
      setError('An error occurred while evaluating the clinic')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    const userInput = input
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await clinicChatService.sendMessage(userInput)

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError('An error occurred while sending your message')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleReset = () => {
    setMessages([])
    clinicChatService.clearHistory()
    setError(null)
  }

  return (
    <div className="clinic-evaluator">
      <div className="evaluator-header">
        <h2>AI Clinic Evaluator</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {clinicName && messages.length === 0 && (
        <div className="clinic-info">
          <h3>{clinicName}</h3>
          {clinicAddress && <p className="clinic-address">{clinicAddress}</p>}
          <button
            className="evaluate-btn"
            onClick={handleEvaluateClinic}
            disabled={isLoading}
          >
            {isLoading ? 'Evaluating...' : 'Evaluate This Clinic'}
          </button>
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 && !clinicName && (
          <div className="empty-state">
            <p>Ask me anything about clinic quality, what to look for, or specific concerns you have about pregnancy care.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="input-section">
        {messages.length > 0 && (
          <button className="reset-btn" onClick={handleReset}>
            🔄 New Conversation
          </button>
        )}
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about clinic quality, safety, or specific concerns..."
            disabled={isLoading}
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="send-btn"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
