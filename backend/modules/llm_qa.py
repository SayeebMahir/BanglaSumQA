"""
LLM QA Module — uses OpenAI GPT-4o-mini for:
1. Refining BanglaT5 draft summaries into beautiful, human-readable Bangla
2. Answering contextual questions (multi-turn) grounded in document context
"""

import os
from typing import List, Dict

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


# ---------------------------------------------------------------------------
# API Key Check
# ---------------------------------------------------------------------------

def is_api_key_configured() -> bool:
    """Check if a valid OpenAI API key is set in the environment."""
    key = os.getenv("OPENAI_API_KEY", "")
    return bool(key and key != "your_openai_api_key_here" and len(key) > 20)


def _get_client() -> OpenAI:
    """Return an OpenAI client, raising a clear error if key is missing."""
    if not is_api_key_configured():
        raise ValueError(
            "OpenAI API key কনফিগার করা হয়নি। "
            "backend/.env ফাইলে OPENAI_API_KEY সেট করুন।"
        )
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# ---------------------------------------------------------------------------
# Summary Refinement
# ---------------------------------------------------------------------------

def refine_summary(original_text: str, draft_summary: str) -> str:
    """
    Use GPT-4o-mini to transform a BanglaT5 draft summary into
    a polished, natural, and reader-friendly Bangla summary.

    Args:
        original_text: The original source text (first ~3000 chars used).
        draft_summary: Raw output from BanglaT5.

    Returns:
        Refined, beautiful Bangla summary.
    """
    client = _get_client()

    system_prompt = (
        "আপনি একজন বিশেষজ্ঞ বাংলা ভাষা সম্পাদক এবং লেখক। "
        "আপনার কাজ হল একটি AI-জেনারেটেড খসড়া সারসংক্ষেপকে "
        "পেশাদার, সাহিত্যিক এবং পাঠকবান্ধব বাংলায় রূপান্তরিত করা।\n\n"
        "নিম্নলিখিত নির্দেশিকা কঠোরভাবে মেনে চলুন:\n"
        "১. সারসংক্ষেপটি সুগঠিত অনুচ্ছেদে লিখুন\n"
        "২. মূল বিষয়বস্তু ও গুরুত্বপূর্ণ তথ্য সংরক্ষণ করুন\n"
        "৩. ভাষা প্রাঞ্জল, সহজবোধ্য ও আকর্ষণীয় করুন\n"
        "৪. অপ্রয়োজনীয় পুনরাবৃত্তি ও অসংগতি দূর করুন\n"
        "৫. শুধুমাত্র বাংলায় উত্তর দিন, ইংরেজি মিশ্রণ এড়িয়ে চলুন\n"
        "৬. সারসংক্ষেপটি ৩-৫টি অনুচ্ছেদে সীমিত রাখুন"
    )

    user_content = (
        f"মূল নথি (প্রথম অংশ):\n{original_text[:3000]}\n\n"
        f"BanglaT5-এর খসড়া সারসংক্ষেপ:\n{draft_summary}\n\n"
        "অনুগ্রহ করে এই খসড়াটি পরিমার্জন করে একটি সুন্দর, "
        "পূর্ণাঙ্গ এবং পাঠকবান্ধব বাংলা সারসংক্ষেপ তৈরি করুন।"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.65,
            max_tokens=1200,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[GPT] Refinement failed: {e}")
        # Fall back to draft summary
        return draft_summary


# ---------------------------------------------------------------------------
# Conversational QA
# ---------------------------------------------------------------------------

def answer_question(
    context: str,
    summary: str,
    question: str,
    history: List[Dict[str, str]],
) -> str:
    """
    Answer a user question using GPT-4o-mini grounded in document context.
    Maintains multi-turn conversation history.

    Args:
        context: Source document text (or first 6000 chars).
        summary: Refined Bangla summary.
        question: User's current question.
        history: List of previous {role, content} turns (last 8 used).

    Returns:
        AI answer in Bangla.
    """
    client = _get_client()

    system_prompt = (
        "আপনি BanglaSumQA — একটি বুদ্ধিমান বাংলা AI সহকারী। "
        "আপনাকে প্রদত্ত নথি এবং সারসংক্ষেপের উপর ভিত্তি করে "
        "ব্যবহারকারীর প্রশ্নের উত্তর দিতে হবে।\n\n"
        "নিম্নলিখিত নিয়ম মেনে চলুন:\n"
        "১. শুধুমাত্র প্রদত্ত প্রসঙ্গ ও সারসংক্ষেপ থেকে তথ্য ব্যবহার করুন\n"
        "২. উত্তর স্পষ্ট, সংক্ষিপ্ত কিন্তু তথ্যপূর্ণ রাখুন\n"
        "৩. প্রসঙ্গে উত্তর না থাকলে সরাসরি বলুন: 'এই তথ্য নথিতে নেই।'\n"
        "৪. সবসময় বাংলায় উত্তর দিন\n"
        "৫. প্রয়োজনে বুলেট পয়েন্ট বা নম্বর তালিকা ব্যবহার করুন\n\n"
        f"নথির সারসংক্ষেপ:\n{summary}\n\n"
        f"মূল নথি (প্রাসঙ্গিক অংশ):\n{context[:5000]}"
    )

    # Build messages: system + history (last 8 turns) + current question
    messages = [{"role": "system", "content": system_prompt}]

    for msg in history[-8:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=900,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"GPT উত্তর তৈরিতে সমস্যা হয়েছে: {e}")
