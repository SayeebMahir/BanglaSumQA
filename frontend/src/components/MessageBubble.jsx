import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isBot  = message.role === 'assistant'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  return (
    <div className={`message-row ${isUser ? 'user' : ''}`}>
      {/* Avatar */}
      {isBot && (
        <div className="message-avatar bot" aria-label="AI সহকারী">ব</div>
      )}
      {isUser && (
        <div className="message-avatar user" aria-label="ব্যবহারকারী">আ</div>
      )}

      <div className="message-bubble-wrapper">
        {/* Bubble */}
        {message.loading ? (
          /* ── Loading State ──────────────────────── */
          <div className="loading-bubble">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
            {message.step && (
              <span className="loading-label">{message.step}</span>
            )}
          </div>
        ) : message.isError ? (
          /* ── Error State ────────────────────────── */
          <div className="error-bubble">{message.content}</div>
        ) : (
          /* ── Normal Message ─────────────────────── */
          <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
            {isBot ? (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            ) : (
              message.isFile ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {message.content}
                </span>
              ) : (
                message.content
              )
            )}
          </div>
        )}

        {/* Meta row */}
        {!message.loading && message.content && (
          <div className="message-meta">
            <span className="message-time">{message.time}</span>
            {isBot && !message.isError && (
              <button className="copy-btn" onClick={handleCopy} id={`copy-${message.id}`}>
                {copied ? '✓ কপি হয়েছে' : '⧉ কপি'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
