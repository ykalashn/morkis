import io
import os
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import plaid
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "morkis.db"
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


class PlaidLinkTokenRequest(BaseModel):
    user_id: str


class PlaidExchangeTokenRequest(BaseModel):
    user_id: str
    public_token: str


def init_db() -> None:
    with sqlite3.connect(DATABASE) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS plaid_items (
                user_id TEXT PRIMARY KEY,
                access_token TEXT NOT NULL,
                item_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def upsert_plaid_item(user_id: str, access_token: str, item_id: Optional[str]) -> None:
    with sqlite3.connect(DATABASE) as conn:
        conn.execute(
            """
            INSERT INTO plaid_items (user_id, access_token, item_id)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                access_token = excluded.access_token,
                item_id = excluded.item_id,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, access_token, item_id),
        )
        conn.commit()


def get_access_token(user_id: str) -> Optional[str]:
    with sqlite3.connect(DATABASE) as conn:
        row = conn.execute(
            "SELECT access_token FROM plaid_items WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    return row[0] if row else None


def get_plaid_client() -> plaid_api.PlaidApi:
    client_id = os.getenv("PLAID_CLIENT_ID")
    secret = os.getenv("PLAID_SECRET")
    env = os.getenv("PLAID_ENV", "sandbox").lower()
    if not client_id or not secret:
        raise HTTPException(status_code=500, detail="Missing PLAID_CLIENT_ID or PLAID_SECRET")

    env_map = {
        "sandbox": plaid.Environment.Sandbox,
        "development": plaid.Environment.Development,
        "production": plaid.Environment.Production,
    }
    host = env_map.get(env)
    if not host:
        raise HTTPException(status_code=500, detail=f"Unsupported PLAID_ENV: {env}")

    configuration = plaid.Configuration(
        host=host,
        api_key={
            "clientId": client_id,
            "secret": secret,
        },
    )
    api_client = plaid.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)


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


@app.post("/api/plaid/create_link_token")
def create_link_token(payload: PlaidLinkTokenRequest):
    plaid_client = get_plaid_client()
    country_codes = [
        CountryCode(code.strip().upper())
        for code in os.getenv("PLAID_COUNTRY_CODES", "US").split(",")
        if code.strip()
    ]

    try:
        request_data = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=payload.user_id),
            client_name="Morkis",
            products=[Products("transactions")],
            country_codes=country_codes,
            language="en",
        )
        response = plaid_client.link_token_create(request_data)
        return {"link_token": response.link_token}
    except plaid.ApiException as exc:
        raise HTTPException(status_code=500, detail=f"Plaid link token failed: {exc}") from exc


@app.post("/api/plaid/exchange_public_token")
def exchange_public_token(payload: PlaidExchangeTokenRequest):
    plaid_client = get_plaid_client()
    try:
        exchange_request = ItemPublicTokenExchangeRequest(public_token=payload.public_token)
        response = plaid_client.item_public_token_exchange(exchange_request)
        upsert_plaid_item(payload.user_id, response.access_token, response.item_id)
        return {"success": True}
    except plaid.ApiException as exc:
        raise HTTPException(status_code=500, detail=f"Plaid token exchange failed: {exc}") from exc


@app.get("/api/plaid/transactions")
def get_transactions(user_id: str, days: int = 90):
    access_token = get_access_token(user_id)
    if not access_token:
        raise HTTPException(status_code=404, detail="No Plaid access token for this user")

    plaid_client = get_plaid_client()
    end_date = date.today()
    start_date = end_date - timedelta(days=max(1, min(days, 365)))

    try:
        transactions_request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(count=500),
        )
        response = plaid_client.transactions_get(transactions_request)

        transactions: list[dict[str, object]] = []
        for txn in response.transactions:
            primary_category = "OTHER"
            detailed_category = "OTHER"
            confidence = "UNKNOWN"

            if getattr(txn, "personal_finance_category", None):
                pfc = txn.personal_finance_category
                primary_category = getattr(pfc, "primary", "OTHER") or "OTHER"
                detailed_category = getattr(pfc, "detailed", primary_category) or primary_category
                confidence = getattr(pfc, "confidence_level", "UNKNOWN") or "UNKNOWN"

            transactions.append(
                {
                    "id": txn.transaction_id,
                    "name": txn.merchant_name or txn.name,
                    "amount": txn.amount,
                    "date": txn.date.isoformat() if isinstance(txn.date, (date, datetime)) else str(txn.date),
                    "primary_category": primary_category,
                    "detailed_category": detailed_category,
                    "confidence": confidence,
                    "logo_url": getattr(txn, "logo_url", None),
                }
            )

        return {"transactions": transactions}
    except plaid.ApiException as exc:
        raise HTTPException(status_code=500, detail=f"Plaid transactions failed: {exc}") from exc


@app.get("/api/plaid/status")
def plaid_status(user_id: str):
    return {"user_id": user_id, "has_access_token": bool(get_access_token(user_id))}


init_db()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
