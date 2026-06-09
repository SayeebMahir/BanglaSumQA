import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3 min — model inference can be slow on CPU
})

// ── Helper: extract readable error message ──────────────────
function extractError(err) {
  const detail = err?.response?.data?.detail
  if (detail) return detail
  if (err?.message) return `নেটওয়ার্ক সমস্যা: ${err.message}`
  return 'একটি অজানা সমস্যা হয়েছে।'
}

// ── Health Check ─────────────────────────────────────────────
export async function checkHealth() {
  const res = await api.get('/health')
  return res.data
}

// ── Summarize: PDF file or raw text ─────────────────────────
export async function summarizeDocument({ file, text, onProgress }) {
  const formData = new FormData()
  if (file) formData.append('file', file)
  if (text) formData.append('text', text)

  try {
    const res = await api.post('/summarize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    return res.data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

// ── Chat / QA ─────────────────────────────────────────────────
export async function sendChatMessage({ question, context, summary, history }) {
  try {
    const res = await api.post('/chat', {
      question,
      context: context || '',
      summary: summary || '',
      history: history || [],
    })
    return res.data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

// ── Transcribe audio blob ─────────────────────────────────────
export async function transcribeAudio(audioBlob) {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')

  try {
    const res = await api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  } catch (err) {
    throw new Error(extractError(err))
  }
}
