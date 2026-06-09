import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'

const FEATURE_CARDS = [
  {
    icon: '📄',
    title: 'PDF সারসংক্ষেপ',
    desc: 'যেকোনো বাংলা PDF আপলোড করুন এবং AI-চালিত সারসংক্ষেপ পান।',
    prompt: 'একটি বাংলা PDF আপলোড করে সারসংক্ষেপ তৈরি করুন।',
  },
  {
    icon: '🎙️',
    title: 'কণ্ঠস্বর ইনপুট',
    desc: 'বাংলায় কথা বলুন — Whisper AI আপনার কণ্ঠস্বর লেখায় রূপান্তরিত করবে।',
    prompt: 'মাইক্রোফোন বোতাম ব্যবহার করে বাংলায় কথা বলুন।',
  },
  {
    icon: '❓',
    title: 'প্রশ্নোত্তর (QA)',
    desc: 'নথি আপলোডের পরে সারসংক্ষেপ থেকে যেকোনো প্রশ্ন করুন।',
    prompt: 'নথির মূল বিষয় কী?',
  },
]

export default function ChatWindow({ messages, isLoading, loadingStep, onCardClick }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const isEmpty = messages.length === 0

  return (
    <div className="chat-window">
      {isEmpty ? (
        /* ── Welcome Screen ─────────────────────────── */
        <div className="welcome-screen">
          <div className="welcome-logo">ব</div>
          <h1 className="welcome-title">
            স্বাগতম — <span>BanglaSumQA</span>
          </h1>
          <p className="welcome-subtitle">
            বাংলা নথি বিশ্লেষণ, সারসংক্ষেপ ও প্রশ্নোত্তরের AI সহকারী
          </p>
          <p className="welcome-subtitle-en">
            Bangla AI Summarization &amp; Question Answering
          </p>

          <div className="welcome-cards">
            {FEATURE_CARDS.map((card, i) => (
              <div
                key={i}
                className="welcome-card"
                onClick={() => onCardClick(card.prompt)}
                role="button"
                tabIndex={0}
                id={`welcome-card-${i}`}
                onKeyDown={e => e.key === 'Enter' && onCardClick(card.prompt)}
              >
                <span className="welcome-card-icon">{card.icon}</span>
                <div className="welcome-card-title">{card.title}</div>
                <div className="welcome-card-desc">{card.desc}</div>
              </div>
            ))}
          </div>

          <div className="welcome-tips">
            <span className="welcome-tip">📎 নিচের ক্লিপ বোতামে PDF যুক্ত করুন</span>
            <span className="welcome-tip">🎙️ মাইক বোতামে কথা বলুন</span>
            <span className="welcome-tip">⌨️ বাংলায় টাইপ করুন</span>
          </div>
        </div>
      ) : (
        /* ── Messages List ──────────────────────────── */
        <div className="messages-container">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading indicator when a new bot response is expected
              but there's no loading message yet */}
          {isLoading && loadingStep && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="message-row">
              <div className="message-avatar bot">ব</div>
              <div className="processing-overlay">
                <div className="processing-spinner" />
                <div>
                  <div className="processing-text">প্রক্রিয়া করা হচ্ছে</div>
                  <div className="processing-step">{loadingStep}</div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} style={{ height: 16 }} />
        </div>
      )}
    </div>
  )
}
