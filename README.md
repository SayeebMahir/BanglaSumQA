---
title: BanglaSumQA
emoji: 🇧🇩
colorFrom: orange
colorTo: red
sdk: docker
pinned: false
app_port: 7860
---

# BanglaSumQA 🇧🇩


**বাংলা AI সারসংক্ষেপ ও প্রশ্নোত্তর সহকারী**
*Bangla AI Summarization & Question Answering*

[![BanglaT5](https://img.shields.io/badge/BanglaT5-csebuetnlp-orange)](https://huggingface.co/csebuetnlp/BanglaT5)
[![Whisper](https://img.shields.io/badge/Whisper-medium-blue)](https://github.com/openai/whisper)
[![GPT-4o-mini](https://img.shields.io/badge/GPT-4o--mini-purple)](https://platform.openai.com)

---

## বৈশিষ্ট্য (Features)

- 📄 **PDF সারসংক্ষেপ** — যেকোনো বাংলা PDF আপলোড করুন
- 🎙️ **কণ্ঠস্বর ইনপুট** — Whisper ASR দিয়ে বাংলা বাক-থেকে-টেক্সট
- 🤖 **AI পাইপলাইন** — BanglaT5 → GPT-4o-mini পরিমার্জন
- ❓ **প্রশ্নোত্তর** — সারসংক্ষেপ থেকে মাল্টি-টার্ন QA
- 🎨 **আধুনিক UI** — ChatGPT-অনুপ্রাণিত লাইট অরেঞ্জ ডিজাইন

---

## প্রযুক্তি স্ট্যাক

| স্তর | প্রযুক্তি |
|------|-----------|
| Frontend | React 18 + Vite + Vanilla CSS |
| Backend | FastAPI (Python 3.10+) |
| Summarization | `csebuetnlp/BanglaT5` |
| Speech-to-Text | OpenAI Whisper (medium, local) |
| Refinement & QA | GPT-4o-mini API |
| PDF Extraction | PyMuPDF (fitz) |

---

## দ্রুত শুরু (Quick Start)

### পূর্বশর্ত
- Python 3.10+
- Node.js 18+
- **ffmpeg** (Whisper-এর জন্য অপরিহার্য)
  ```
  # Windows (Chocolatey)
  choco install ffmpeg

  # বা Scoop
  scoop install ffmpeg
  ```

### ধাপ ১: Repository Clone করুন
```bash
git clone <your-repo-url>
cd BanglaSumQA
```

### ধাপ ২: OpenAI API Key সেট করুন
```bash
# backend/.env ফাইল সম্পাদনা করুন:
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

### ধাপ ৩: Backend চালু করুন
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py
```
> ⚠️ প্রথমবার চালু করলে BanglaT5 (~900MB) ও Whisper (~1.5GB) ডাউনলোড হবে।

### ধাপ ৪: Frontend চালু করুন (নতুন terminal)
```bash
cd frontend
npm install
npm run dev
```

### ধাপ ৫: Browser খুলুন
```
http://localhost:5173
```

---

## Windows One-Click Start
```bash
start.bat
```

---

## AI পাইপলাইন

```
User Input
│
├── PDF Upload ──→ PyMuPDF Extract ──→ BanglaT5 (Draft) ──→ GPT-4o-mini (Refine) ──→ Summary
│
├── Voice Input ─→ Whisper ASR (Bangla) ──→ Text in Input Field
│
└── Question ────→ GPT-4o-mini (Context + Summary + History) ──→ Answer
```

---

## ফোল্ডার কাঠামো

```
BanglaSumQA/
├── backend/
│   ├── app.py                  # FastAPI main
│   ├── requirements.txt
│   ├── .env                    # API keys (gitignored)
│   └── modules/
│       ├── pdf_extractor.py    # PyMuPDF
│       ├── summarizer.py       # BanglaT5 + chunking
│       ├── asr_engine.py       # Whisper ASR
│       └── llm_qa.py           # GPT-4o-mini
└── frontend/
    ├── src/
    │   ├── App.jsx             # Root state management
    │   ├── index.css           # Design system
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── MessageBubble.jsx
    │   │   ├── InputBar.jsx
    │   │   └── SummaryPanel.jsx
    │   └── services/api.js     # Axios API client
    └── vite.config.js
```

---

## API Endpoints

| Method | Endpoint | বিবরণ |
|--------|----------|-------|
| GET | `/api/health` | সার্ভার স্বাস্থ্য পরীক্ষা |
| POST | `/api/summarize` | PDF/text সারসংক্ষেপ |
| POST | `/api/chat` | প্রশ্নোত্তর QA |
| POST | `/api/transcribe` | অডিও → বাংলা টেক্সট |

API Docs: `http://localhost:8000/docs`
Live at Hugging Face
---

## লাইসেন্স
MIT License
