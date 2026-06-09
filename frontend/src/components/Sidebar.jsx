export default function Sidebar({ sessions, hasDocument, documentName, onNewChat, onShowSummary }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">ব</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">BanglaSumQA</span>
          <span className="sidebar-logo-tagline">বাংলা AI সহকারী</span>
        </div>
      </div>

      {/* New Chat */}
      <button className="new-chat-btn" onClick={onNewChat} id="btn-new-chat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        নতুন কথোপকথন
      </button>

      {/* Current document */}
      {hasDocument && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">বর্তমান নথি</div>
          <button className="sidebar-btn active" onClick={onShowSummary} id="btn-show-summary">
            <svg className="sidebar-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
              {documentName}
            </span>
          </button>
        </div>
      )}

      {/* Tools */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">বৈশিষ্ট্য</div>
        <button className="sidebar-btn" title="PDF আপলোড করুন">
          <svg className="sidebar-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          PDF আপলোড
        </button>
        <button className="sidebar-btn" title="কণ্ঠস্বর ইনপুট">
          <svg className="sidebar-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
          কণ্ঠস্বর ইনপুট
        </button>
        <button className="sidebar-btn" title="সারসংক্ষেপ">
          <svg className="sidebar-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="21" y1="18" x2="12" y2="18" />
          </svg>
          AI সারসংক্ষেপ
        </button>
      </div>

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">পূর্ববর্তী কথোপকথন</div>
          <div className="sidebar-history">
            {sessions.map(s => (
              <div key={s.id} className="history-item" title={s.label}>
                <div className="history-item-dot" />
                <span className="history-item-text">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Footer info */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          🤖 BanglaT5 · Whisper ASR · GPT-4o-mini
        </div>
        <div className="sidebar-footer-info" style={{ marginTop: 4, fontSize: 10 }}>
          বাংলা ভাষার জন্য তৈরি AI সহকারী
        </div>
      </div>
    </aside>
  )
}
