import { useState, useRef, useEffect, useCallback } from 'react'

export default function InputBar({ isLoading, hasDocument, onSendText, onFileSelect, onTranscript }) {
  const [text, setText]               = useState('')
  const [file, setFile]               = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const textareaRef     = useRef(null)
  const fileInputRef    = useRef(null)
  const mediaRecRef     = useRef(null)
  const audioChunksRef  = useRef([])

  /* ── Auto-resize textarea ──────────────────────────────── */
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [text])

  /* ── Send logic ────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    if (isLoading || isTranscribing) return

    if (file) {
      await onFileSelect(file)
      setFile(null)
      setText('')
      return
    }

    const msg = text.trim()
    if (!msg) return
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await onSendText(msg)
  }, [isLoading, isTranscribing, file, text, onFileSelect, onSendText])

  /* ── Keyboard: Enter to send, Shift+Enter for newline ───── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /* ── File picker ────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setText('')
    }
    e.target.value = ''
  }

  const removeFile = () => setFile(null)

  /* ── Voice recording ────────────────────────────────────── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: mimeType })

        if (blob.size < 500) return // too short / silence

        setIsTranscribing(true)
        try {
          const transcript = await onTranscript(blob)
          if (transcript) {
            setText(prev => prev ? prev + ' ' + transcript : transcript)
            textareaRef.current?.focus()
          }
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start(200) // collect chunks every 200ms
      setIsRecording(true)
    } catch (err) {
      alert('মাইক্রোফোন অ্যাক্সেস করতে পারা যাচ্ছে না। অনুগ্রহ করে ব্রাউজার অনুমতি দিন।')
    }
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current && isRecording) {
      mediaRecRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const toggleRecording = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  /* ── Can send? ──────────────────────────────────────────── */
  const canSend = !isLoading && !isTranscribing && (file || text.trim().length > 0)

  /* ── Placeholder ────────────────────────────────────────── */
  const placeholder = isTranscribing
    ? 'কণ্ঠস্বর লেখায় রূপান্তরিত হচ্ছে...'
    : isRecording
      ? '🔴 রেকর্ড হচ্ছে... থামাতে মাইক্রোফোনে ক্লিক করুন'
      : hasDocument
        ? 'নথি সম্পর্কে প্রশ্ন করুন...'
        : 'বাংলায় টাইপ করুন বা PDF/কণ্ঠস্বর দিন...'

  return (
    <div className="input-bar-wrapper">
      <div className="input-bar-inner">
        {/* ── Attached file chip ── */}
        {file && (
          <div>
            <span className="attachment-chip">
              <span className="attachment-chip-icon">📄</span>
              {file.name}
              <button
                className="attachment-chip-remove"
                onClick={removeFile}
                aria-label="ফাইল সরান"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* ── Input box ── */}
        <div className="input-box">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="input-textarea bangla"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading || isRecording}
            aria-label="বার্তা লিখুন"
          />

          <div className="input-actions">
            {/* PDF Attachment button */}
            <button
              className="input-action-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isRecording}
              title="PDF আপলোড করুন"
              aria-label="PDF আপলোড"
              id="btn-attach-pdf"
            >
              📎
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Voice record button */}
            <button
              className={`input-action-btn${isRecording ? ' recording' : ''}`}
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing || Boolean(file)}
              title={isRecording ? 'রেকর্ডিং বন্ধ করুন' : 'কণ্ঠস্বর ইনপুট'}
              aria-label={isRecording ? 'রেকর্ডিং বন্ধ' : 'কণ্ঠস্বর রেকর্ড'}
              id="btn-voice"
            >
              {isTranscribing ? (
                <span style={{ fontSize: 12, animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
              ) : isRecording ? (
                '⏹'
              ) : (
                '🎙️'
              )}
            </button>

            {/* Send button */}
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!canSend}
              title="পাঠান (Enter)"
              aria-label="বার্তা পাঠান"
              id="btn-send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        <p className="input-hint">
          {hasDocument
            ? 'নথির প্রসঙ্গে উত্তর দেওয়া হবে · BanglaT5 + GPT-4o-mini'
            : 'PDF আপলোড করুন অথবা সরাসরি বাংলায় প্রশ্ন করুন'}
        </p>
      </div>
    </div>
  )
}
