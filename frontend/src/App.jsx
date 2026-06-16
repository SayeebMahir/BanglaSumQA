import { useState, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import InputBar from './components/InputBar.jsx'
import SummaryPanel from './components/SummaryPanel.jsx'
import { summarizeDocument, sendChatMessage, transcribeAudio, checkHealth } from './services/api.js'

let msgIdCounter = 0
const newId = () => `msg-${++msgIdCounter}`

const formatTime = () =>
  new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })

export default function App() {
  /* ── State ─────────────────────────────────────────────── */
  const [messages, setMessages]           = useState([])
  const [summary, setSummary]             = useState('')
  const [draftSummary, setDraftSummary]   = useState('')
  const [sourceContext, setSourceContext] = useState('')
  const [documentName, setDocumentName]   = useState('')
  const [wordCount, setWordCount]         = useState(0)
  const [isLoading, setIsLoading]         = useState(false)
  const [loadingStep, setLoadingStep]     = useState('')
  const [showSummary, setShowSummary]     = useState(false)
  const [apiKeyOk, setApiKeyOk]           = useState(true)
  const [sessions, setSessions]           = useState([])

  // Conversation history for multi-turn QA
  const historyRef = useRef([])

  /* ── Helper: add message ───────────────────────────────── */
  const addMessage = useCallback((role, content, extra = {}) => {
    const msg = { id: newId(), role, content, time: formatTime(), ...extra }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const replaceLastBot = useCallback((content, extra = {}) => {
    setMessages(prev => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      if (last && last.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content, loading: false, ...extra }
      }
      return copy
    })
  }, [])

  /* ── New Chat ──────────────────────────────────────────── */
  const handleNewChat = useCallback(() => {
    if (messages.length > 0 && documentName) {
      setSessions(prev => [
        { id: Date.now(), label: documentName || 'নতুন কথোপকথন', time: formatTime() },
        ...prev.slice(0, 9),
      ])
    }
    setMessages([])
    setSummary('')
    setDraftSummary('')
    setSourceContext('')
    setDocumentName('')
    setWordCount(0)
    setShowSummary(false)
    historyRef.current = []
  }, [messages.length, documentName])

  /* ── Handle PDF upload + summarization ─────────────────── */
  const handleDocument = useCallback(async (file) => {
    const fname = file.name
    setDocumentName(fname)
    setIsLoading(true)
    setLoadingStep('PDF বিশ্লেষণ করা হচ্ছে...')

    // Show processing message in chat
    addMessage('user', `📄 ${fname}`, { isFile: true })
    const botMsg = addMessage('assistant', '', { loading: true, step: 'PDF বিশ্লেষণ...' })

    try {
      setLoadingStep('BanglaT5 দিয়ে সারসংক্ষেপ তৈরি হচ্ছে...')
      const result = await summarizeDocument({ file })

      setSummary(result.summary)
      setDraftSummary(result.draft_summary)
      setSourceContext(result.source_text)
      setWordCount(result.word_count)
      setShowSummary(true)

      // Check health for API key status
      try {
        const health = await checkHealth()
        setApiKeyOk(health.openai_configured)
      } catch (_) {}

      const gptNote = result.gpt_refined
        ? 'পরিমার্জিত'
        : '⚠️ API key নেই — BanglaSum খসড়া দেখানো হচ্ছে'

      replaceLastBot(
        `✅ **"${fname}"** বিশ্লেষণ সম্পন্ন!\n\n` +
        `📊 **শব্দ সংখ্যা:** ${result.word_count.toLocaleString('bn-BD')}\n` +
        `🤖 **পদ্ধতি:** ${gptNote}\n\n` +
        `ডানদিকের প্যানেলে সারসংক্ষেপ দেখুন। এখন এই নথি সম্পর্কে যেকোনো প্রশ্ন করুন! 💬`,
        { loading: false }
      )

      historyRef.current.push(
        { role: 'user', content: `আমি "${fname}" নামের একটি নথি আপলোড করেছি।` },
        { role: 'assistant', content: `নথিটির সারসংক্ষেপ: ${result.summary.slice(0, 500)}` }
      )

    } catch (err) {
      replaceLastBot(`❌ ${err.message}`, { loading: false, isError: true })
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }, [addMessage, replaceLastBot])

  /* ── Handle text message / QA ──────────────────────────── */
  const handleTextMessage = useCallback(async (text) => {
    if (!text.trim()) return

    addMessage('user', text)
    const hasDoc = Boolean(summary && sourceContext)

    setIsLoading(true)

    // ── No document loaded: treat the text as a new document to summarise ──
    if (!hasDoc) {
      setLoadingStep('BanglaT5 দিয়ে সারসংক্ষেপ তৈরি হচ্ছে...')
      addMessage('assistant', '', { loading: true, step: 'সারসংক্ষেপ...' })
      try {
        const result = await summarizeDocument({ text })

        setSummary(result.summary)
        setDraftSummary(result.draft_summary)
        setSourceContext(result.source_text)
        setWordCount(result.word_count)
        setDocumentName('টেক্সট ইনপুট')
        setShowSummary(true)

        try {
          const health = await checkHealth()
          setApiKeyOk(health.openai_configured)
        } catch (_) {}

        const gptNote = result.gpt_refined
          ? 'পরিমার্জিত'
          : '⚠️ API key নেই — BanglaSum খসড়া দেখানো হচ্ছে'

        replaceLastBot(
          `✅ **সারসংক্ষেপ সম্পন্ন!**\n\n` +
          `📊 **শব্দ সংখ্যা:** ${result.word_count.toLocaleString('bn-BD')}\n` +
          `🤖 **পদ্ধতি:** ${gptNote}\n\n` +
          `ডানদিকের প্যানেলে সারসংক্ষেপ দেখুন। এখন এই লেখা সম্পর্কে যেকোনো প্রশ্ন করুন! 💬`,
          { loading: false }
        )

        historyRef.current.push(
          { role: 'user', content: `আমি একটি বাংলা লেখা দিয়েছি।` },
          { role: 'assistant', content: `লেখাটির সারসংক্ষেপ: ${result.summary.slice(0, 500)}` }
        )
      } catch (err) {
        replaceLastBot(`❌ ${err.message}`, { loading: false, isError: true })
      } finally {
        setIsLoading(false)
        setLoadingStep('')
      }
      return
    }

    // ── Document loaded: answer question via QA ───────────────────────────
    setLoadingStep('উত্তর খোঁজা হচ্ছে...')
    addMessage('assistant', '', { loading: true })
    historyRef.current.push({ role: 'user', content: text })

    try {
      const result = await sendChatMessage({
        question: text,
        context: sourceContext,
        summary: summary,
        history: historyRef.current.slice(-8),
      })

      replaceLastBot(result.answer)
      historyRef.current.push({ role: 'assistant', content: result.answer })

    } catch (err) {
      replaceLastBot(`❌ ${err.message}`, { isError: true })
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }, [summary, sourceContext, addMessage, replaceLastBot])

  /* ── Handle voice transcript ───────────────────────────── */
  const handleTranscript = useCallback(async (audioBlob) => {
    setIsLoading(true)
    setLoadingStep('কণ্ঠস্বর শনাক্ত করা হচ্ছে...')
    try {
      const result = await transcribeAudio(audioBlob)
      return result.transcript
    } catch (err) {
      addMessage('assistant', `❌ কণ্ঠস্বর রূপান্তরে সমস্যা: ${err.message}`, { isError: true })
      return ''
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }, [addMessage])

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        hasDocument={Boolean(documentName)}
        documentName={documentName}
        onNewChat={handleNewChat}
        onShowSummary={() => setShowSummary(true)}
      />

      <div className="main-area">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <span>🇧🇩</span>
            {documentName
              ? <span>{documentName}</span>
              : <span>BanglaSumQA</span>}
            {documentName && (
              <span className="chat-header-badge">QA মোড</span>
            )}
          </div>
          <div className="chat-header-actions">
            {summary && (
              <button
                className="header-icon-btn"
                title="সারসংক্ষেপ দেখুন"
                onClick={() => setShowSummary(v => !v)}
              >
                📋
              </button>
            )}
            <button
              className="header-icon-btn"
              title="নতুন চ্যাট"
              onClick={handleNewChat}
            >
              ✏️
            </button>
          </div>
        </div>

        {/* API key warning banner */}
        {!apiKeyOk && messages.length > 0 && (
          <div className="api-key-banner">
            ⚠️ OpenAI API key কনফিগার করা নেই।{' '}
            <code>backend/.env</code> ফাইলে{' '}
            <strong>OPENAI_API_KEY</strong> যোগ করুন।
          </div>
        )}

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          loadingStep={loadingStep}
          onCardClick={handleTextMessage}
        />

        <InputBar
          isLoading={isLoading}
          hasDocument={Boolean(summary)}
          onSendText={handleTextMessage}
          onFileSelect={handleDocument}
          onTranscript={handleTranscript}
        />
      </div>

      {showSummary && summary && (
        <SummaryPanel
          summary={summary}
          draftSummary={draftSummary}
          documentName={documentName}
          wordCount={wordCount}
          onClose={() => setShowSummary(false)}
          onAskQuestion={(q) => {
            setShowSummary(false)
            handleTextMessage(q)
          }}
        />
      )}
    </div>
  )
}
