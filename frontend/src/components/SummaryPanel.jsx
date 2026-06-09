import { useState } from 'react'

const SUGGESTED_QUESTIONS = [
  'এই নথির মূল বিষয় কী?',
  'নথিতে কী কী গুরুত্বপূর্ণ তথ্য আছে?',
  'লেখকের মূল যুক্তি কী?',
  'এই নথির সিদ্ধান্ত কী?',
]

export default function SummaryPanel({
  summary,
  draftSummary,
  documentName,
  wordCount,
  onClose,
  onAskQuestion,
}) {
  const [copied, setCopied]       = useState(false)
  const [showDraft, setShowDraft] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (_) {}
  }

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${documentName?.replace('.pdf', '') || 'summary'}_সারসংক্ষেপ.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="summary-panel" id="summary-panel" role="complementary" aria-label="সারসংক্ষেপ প্যানেল">
      {/* Header */}
      <div className="summary-panel-header">
        <div className="summary-panel-header-top">
          <div className="summary-panel-title">
            📋 সারসংক্ষেপ
          </div>
          <button
            className="summary-panel-close"
            onClick={onClose}
            aria-label="প্যানেল বন্ধ করুন"
            id="btn-close-summary"
          >
            ×
          </button>
        </div>

        {documentName && (
          <div className="summary-file-chip">
            📄 {documentName}
          </div>
        )}

        <div className="summary-stats">
          {wordCount > 0 && (
            <div className="summary-stat">
              📊 {wordCount.toLocaleString('bn-BD')} শব্দ
            </div>
          )}
          <div className="summary-stat">
            🤖 BanglaT5 + GPT-4o-mini
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="summary-panel-body">
        {/* Toggle: refined vs draft */}
        {draftSummary && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              onClick={() => setShowDraft(false)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 8, border: '1.5px solid',
                borderColor: !showDraft ? 'var(--orange-500)' : 'var(--border-light)',
                background: !showDraft ? 'var(--orange-50)' : 'white',
                color: !showDraft ? 'var(--orange-700)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'all 150ms',
              }}
            >
              ✨ পরিমার্জিত
            </button>
            <button
              onClick={() => setShowDraft(true)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 8, border: '1.5px solid',
                borderColor: showDraft ? 'var(--orange-500)' : 'var(--border-light)',
                background: showDraft ? 'var(--orange-50)' : 'white',
                color: showDraft ? 'var(--orange-700)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'all 150ms',
              }}
            >
              🔬 BanglaT5 খসড়া
            </button>
          </div>
        )}

        <div className="summary-section-label">
          {showDraft ? '🔬 BanglaT5 খসড়া সারসংক্ষেপ' : '✨ পরিমার্জিত সারসংক্ষেপ'}
        </div>

        <div className="summary-text bangla" id="summary-text">
          {showDraft ? draftSummary : summary}
        </div>

        {/* Suggested Questions */}
        <div style={{ marginTop: 20 }}>
          <div className="summary-section-label">💡 প্রস্তাবিত প্রশ্ন</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                id={`suggested-q-${i}`}
                onClick={() => onAskQuestion(q)}
                style={{
                  textAlign: 'left', padding: '8px 12px', borderRadius: 10,
                  border: '1px solid var(--border-light)',
                  background: 'white', cursor: 'pointer',
                  fontSize: 12, color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-bangla)', lineHeight: 1.5,
                  transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--orange-300)'
                  e.currentTarget.style.background   = 'var(--orange-50)'
                  e.currentTarget.style.color        = 'var(--orange-700)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-light)'
                  e.currentTarget.style.background   = 'white'
                  e.currentTarget.style.color        = 'var(--text-secondary)'
                }}
              >
                <span style={{ color: 'var(--orange-400)', fontSize: 10 }}>▶</span>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="summary-panel-footer">
        <button
          className="summary-action-btn"
          onClick={handleCopy}
          id="btn-copy-summary"
          title="সারসংক্ষেপ কপি করুন"
        >
          {copied ? '✓ কপি হয়েছে' : '⧉ কপি'}
        </button>
        <button
          className="summary-action-btn"
          onClick={handleDownload}
          id="btn-download-summary"
          title="TXT হিসেবে ডাউনলোড"
        >
          ↓ ডাউনলোড
        </button>
        <button
          className="summary-action-btn primary"
          onClick={() => onAskQuestion('এই নথির মূল বিষয় কী?')}
          id="btn-ask-about-summary"
        >
          ❓ প্রশ্ন করুন
        </button>
      </div>
    </aside>
  )
}
