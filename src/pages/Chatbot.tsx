import { useState, useRef, useEffect } from 'react'
import { FaPaperPlane, FaRobot, FaUser, FaTrash, FaExclamationTriangle } from 'react-icons/fa'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Je suis l'assistant OMNEDU. Comment puis-je vous aider aujourd'hui ?",
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim()) return
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    
    // Simuler la réponse du bot après un délai
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content: "Je suis désolé, je ne peux pas encore répondre car je ne suis pas connecté à un backend. Ce message est seulement une démonstration de l'interface.",
          role: 'assistant',
          timestamp: new Date()
        }
      ])
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const clearChat = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toute la conversation ?')) {
      setMessages([
        {
          id: '1',
          content: "Bonjour ! Je suis l'assistant OMNEDU. Comment puis-je vous aider aujourd'hui ?",
          role: 'assistant',
          timestamp: new Date()
        }
      ])
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1>Assistant OMNEDU</h1>
        <button className="clear-chat-btn" onClick={clearChat}>
          <FaTrash /> Effacer la conversation
        </button>
      </div>

      <div className="message-container">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'assistant' ? <FaRobot /> : <FaUser />}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">
                  {message.role === 'assistant' ? 'Assistant OMNEDU' : 'Vous'}
                </span>
                <span className="message-time">{formatTimestamp(message.timestamp)}</span>
              </div>
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message assistant">
            <div className="message-avatar">
              <FaRobot />
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">Assistant OMNEDU</span>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="not-connected-warning">
        <FaExclamationTriangle />
        <span>Mode démonstration : L'assistant n'est pas connecté à un backend</span>
      </div>

      <form className="message-input-container" onSubmit={handleSendMessage}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message ici..."
          rows={1}
          className="message-input"
        />
        <button type="submit" className="send-button" disabled={!inputValue.trim()}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  )
}

export default Chatbot 