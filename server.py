import io
import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="Morkis API")

allowed_origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")


class RoastRequest(BaseModel):
    user_name: str = "friend"
    failed_goal: str = "your goal"
    amount: str = "€30"


@app.get("/")
def landing() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/index.html")
def landing_html() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/app")
def app_page() -> FileResponse:
    return FileResponse(BASE_DIR / "app.html")


@app.get("/app.html")
def app_html() -> FileResponse:
    return FileResponse(BASE_DIR / "app.html")


@app.post("/api/failure-roast")
def failure_roast(payload: RoastRequest):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return JSONResponse(
            status_code=500,
            content={"error": "ELEVENLABS_API_KEY is missing in environment"},
        )

    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "ysswSXp8U9dFpzPJqFje")
    model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")

    text = (
        f"[sighs] {payload.user_name}, you failed '{payload.failed_goal}'. "
        f"Your stake of {payload.amount} is gone. "
        "Try again, and mean it this time. [exhales]"
    )

    try:
        client = ElevenLabs(api_key=api_key)
        audio_stream = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id=model_id,
            output_format="mp3_44100_128",
        )

        audio_bytes = b"".join(audio_stream)
        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"ElevenLabs request failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
