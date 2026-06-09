"""
BanglaSumQA Backend — Main FastAPI Application
Handles summarization, QA, and speech-to-text for Bangla documents.
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import shutil
import tempfile
import uuid
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from modules.pdf_extractor import extract_text_from_pdf
from modules.summarizer import generate_draft_summary
from modules.asr_engine import transcribe_audio
from modules.llm_qa import refine_summary, answer_question, is_api_key_configured

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BanglaSumQA API",
    description="Bangla Summarization & QA — powered by BanglaT5, Whisper & GPT-4o-mini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "message": "BanglaSumQA API is running",
        "openai_configured": is_api_key_configured(),
    }


# ---------------------------------------------------------------------------
# Summarize: PDF or raw text → BanglaT5 draft → GPT-4o-mini refinement
# ---------------------------------------------------------------------------

@app.post("/api/summarize")
async def summarize(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    source_text = ""
    file_name = ""

    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        file_name = file.filename
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            source_text = extract_text_from_pdf(file_path)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    elif text and text.strip():
        source_text = text.strip()
        file_name = "পেস্ট করা টেক্সট"
    else:
        raise HTTPException(
            status_code=400, detail="Either a PDF file or text content is required."
        )

    if not source_text.strip():
        raise HTTPException(
            status_code=422,
            detail="কোনো টেক্সট বের করা সম্ভব হয়নি। PDF-টি স্ক্যান করা বা পাসওয়ার্ড-সুরক্ষিত হতে পারে।",
        )

    # Step 1: BanglaT5 draft summary
    draft_summary = generate_draft_summary(source_text)

    # Step 2: GPT-4o-mini refinement
    if is_api_key_configured():
        refined_summary = refine_summary(source_text, draft_summary)
        gpt_used = True
    else:
        refined_summary = draft_summary
        gpt_used = False

    return {
        "summary": refined_summary,
        "draft_summary": draft_summary,
        "source_text": source_text[:8000],   # first 8k chars sent as QA context
        "word_count": len(source_text.split()),
        "char_count": len(source_text),
        "file_name": file_name,
        "gpt_refined": gpt_used,
    }


# ---------------------------------------------------------------------------
# Chat / QA: Multi-turn conversation grounded in document context
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    context: str       # Full source text (or first 8k chars)
    summary: str       # Refined summary
    history: List[ChatMessage] = []


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="প্রশ্নটি খালি থাকতে পারবে না।")

    if not is_api_key_configured():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key কনফিগার করা হয়নি। অনুগ্রহ করে backend/.env ফাইলে OPENAI_API_KEY যোগ করুন।",
        )

    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]

    answer = answer_question(
        context=req.context,
        summary=req.summary,
        question=req.question,
        history=history_dicts,
    )

    return {"answer": answer}


# ---------------------------------------------------------------------------
# Transcribe: Audio blob → Bangla text via Whisper
# ---------------------------------------------------------------------------

@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    # Accept webm, ogg, wav, mp3 — Whisper handles all via ffmpeg
    allowed = {".webm", ".ogg", ".wav", ".mp3", ".m4a", ".flac"}
    ext = os.path.splitext(audio.filename or "audio.webm")[1].lower() or ".webm"
    if ext not in allowed:
        ext = ".webm"  # default for browser recordings

    tmp_path = os.path.join(UPLOAD_DIR, f"audio_{uuid.uuid4()}{ext}")
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        transcript = transcribe_audio(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not transcript.strip():
        raise HTTPException(
            status_code=422,
            detail="কোনো কথা শনাক্ত করা যায়নি। আবার চেষ্টা করুন।",
        )

    return {"transcript": transcript}


# ---------------------------------------------------------------------------
# Run directly
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host=host, port=port, reload=True)
