"""
Bangla Summarizer — uses csebuetnlp/BanglaT5 for sequence-to-sequence summarization.
Supports chunking for long documents that exceed the model's token limit.
Model is lazy-loaded on first call.
"""

import os
import re
from typing import List

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# ---------------------------------------------------------------------------
# Model Configuration
# ---------------------------------------------------------------------------

MODEL_NAME = os.getenv("BANGLA_T5_MODEL", "csebuetnlp/BanglaT5")
WHITESPACE_HANDLER = lambda k: " ".join(k.split())

# Lazy-loaded globals
_tokenizer = None
_model = None
_device = None


def _load_model():
    """Lazily load BanglaT5 model and tokenizer (called once on first use)."""
    global _tokenizer, _model, _device

    if _model is not None:
        return  # Already loaded

    print(f"[BanglaT5] Loading model: {MODEL_NAME}")
    print("[BanglaT5] This may take a moment on first run (downloading ~900MB)...")

    _device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[BanglaT5] Using device: {_device}")

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    _model.eval()
    _model.to(_device)

    print("[BanglaT5] Model loaded successfully!")


# ---------------------------------------------------------------------------
# Text Chunking
# ---------------------------------------------------------------------------

def _chunk_text(text: str, max_chars: int = 1400) -> List[str]:
    """
    Split text into chunks using Bangla sentence boundaries (।).
    Falls back to character-based splitting if no punctuation found.
    """
    # Split on Bangla danda (।) and double danda (॥)
    sentences = re.split(r"[।॥]", text)
    chunks: List[str] = []
    current = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        candidate = current + sentence + "। "
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current.strip():
                chunks.append(current.strip())
            # If a single sentence is too long, hard-split it
            if len(sentence) > max_chars:
                for i in range(0, len(sentence), max_chars):
                    chunks.append(sentence[i: i + max_chars])
                current = ""
            else:
                current = sentence + "। "

    if current.strip():
        chunks.append(current.strip())

    return chunks if chunks else [text[:max_chars]]


# ---------------------------------------------------------------------------
# Summarize a Single Chunk
# ---------------------------------------------------------------------------

def _summarize_chunk(text: str) -> str:
    """Run BanglaT5 inference on a single text chunk."""
    _load_model()

    cleaned = WHITESPACE_HANDLER(text)
    prefix = "summarize: " + cleaned

    inputs = _tokenizer(
        prefix,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=512,
    )
    inputs = {k: v.to(_device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=200,
            num_beams=4,
            length_penalty=0.8,
            no_repeat_ngram_size=3,
            early_stopping=True,
        )

    result = _tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result.strip()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_draft_summary(text: str) -> str:
    """
    Generate a BanglaT5 draft summary, chunking long documents automatically.

    For texts ≤1400 chars: single-pass summarization.
    For longer texts: chunk → summarize each → combine → final pass.

    Args:
        text: Input Bangla text (plain string).

    Returns:
        Draft summary string.
    """
    text = text.strip()
    if not text:
        return ""

    # Short text: single pass
    if len(text) <= 1400:
        print("[BanglaT5] Short text — single-pass summarization.")
        return _summarize_chunk(text)

    # Long text: chunk → summarize each chunk
    chunks = _chunk_text(text, max_chars=1400)
    print(f"[BanglaT5] Long document — splitting into {len(chunks)} chunks.")

    chunk_summaries: List[str] = []
    for i, chunk in enumerate(chunks):
        print(f"[BanglaT5] Summarizing chunk {i + 1}/{len(chunks)}...")
        chunk_sum = _summarize_chunk(chunk)
        if chunk_sum:
            chunk_summaries.append(chunk_sum)

    if not chunk_summaries:
        return ""

    combined = " ".join(chunk_summaries)

    # Final aggregation pass if combined summaries are short enough
    if len(combined) <= 1400:
        print("[BanglaT5] Final aggregation pass on combined chunk summaries.")
        return _summarize_chunk(combined)

    # Otherwise return the joined chunk summaries as-is (GPT will refine)
    print("[BanglaT5] Combined summaries too long for final pass — returning as-is for GPT refinement.")
    return combined
