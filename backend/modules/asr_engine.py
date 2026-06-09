"""
Bangla ASR Engine — uses faster-whisper (CTranslate2 backend) for efficient
speech-to-text. Supports webm, ogg, wav, mp3, m4a, flac via ffmpeg.
Model is lazy-loaded on first call.

faster-whisper is a drop-in replacement for openai-whisper with:
  - Same model weights / same quality
  - 4x faster inference
  - Lower memory footprint
  - Proper pip wheel (no build issues)
"""

import os
import sys
import warnings

warnings.filterwarnings("ignore")

# Fix Windows console encoding so Bangla characters print safely
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Lazy-loaded globals
_model = None
_model_size = None


def _log(msg: str):
    """Safe print that never raises UnicodeEncodeError on Windows consoles."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("utf-8", errors="replace").decode("ascii", errors="replace"))


def _load_model():
    """Lazily load faster-whisper model (called once on first use)."""
    global _model, _model_size

    if _model is not None:
        return

    from faster_whisper import WhisperModel

    # 'small' (~500MB) is a good balance: accurate for Bangla, loads in ~60s on CPU
    size = os.getenv("WHISPER_MODEL_SIZE", "small")
    _log(f"[Whisper] Loading faster-whisper model size: '{size}'")
    _log(f"[Whisper] First run will download the model weights (~500MB for 'small')...")

    # Use int8 on CPU for memory efficiency; float16 on GPU
    device  = "cuda" if _cuda_available() else "cpu"
    compute = "float16" if device == "cuda" else "int8"

    _model      = WhisperModel(size, device=device, compute_type=compute)
    _model_size = size
    _log(f"[Whisper] faster-whisper '{size}' loaded on {device} ({compute})!")


def _cuda_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe an audio file to Bangla text using faster-whisper.

    Args:
        audio_path: Path to the audio file (any ffmpeg-supported format).

    Returns:
        Transcribed Bangla text string.

    Raises:
        RuntimeError: If transcription fails.
    """
    _load_model()

    if not os.path.exists(audio_path):
        raise RuntimeError(f"Audio file not found: {audio_path}")

    file_size = os.path.getsize(audio_path)
    if file_size < 100:
        raise RuntimeError("অডিও ফাইলটি খুব ছোট বা খালি।")

    _log(f"[Whisper] Transcribing: {os.path.basename(audio_path)} ({file_size} bytes)")

    try:
        segments, info = _model.transcribe(
            audio_path,
            language="bn",          # Bengali/Bangla
            task="transcribe",
            beam_size=5,
            vad_filter=True,        # Skip silent segments
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        # faster-whisper returns a generator; collect all segment text
        text_parts = [segment.text for segment in segments]
        transcript = " ".join(text_parts).strip()

    except Exception as e:
        raise RuntimeError(f"অডিও ট্রান্সক্রিপশনে সমস্যা হয়েছে: {e}")

    # Safe log: encode preview so Windows cp1252 console never crashes
    preview = transcript[:100].encode("utf-8", errors="replace").decode("ascii", errors="replace")
    _log(f"[Whisper] Transcript ({info.language}, {info.language_probability:.0%}): {preview}...")
    return transcript
