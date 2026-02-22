import io
import os
import random
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import openai

import plaid
import stripe
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

_extra_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

allowed_origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    *_extra_origins,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")


# =========================
# Request models
# =========================
class RoastRequest(BaseModel):
    user_name: str = "friend"
    failed_goal: str = "your goal"
    amount: str = "EUR30"
    anti_charity: str = "your nemesis"


class PlaidLinkTokenRequest(BaseModel):
    user_id: str


class PlaidExchangeTokenRequest(BaseModel):
    user_id: str
    public_token: str


class StripeTestChargeRequest(BaseModel):
    amount_eur: float = 1.0
    payment_method_id: str = "pm_card_visa"
    description: str = "Morkis test charge"


class ContractCreateRequest(BaseModel):
    category: str
    spending_limit: float
    bet_amount: float
    anti_charity: Optional[str] = None
    organization_id: Optional[int] = None
    duration_days: int = 30
    payment_method_id: Optional[str] = None


class MockTransactionCreateRequest(BaseModel):
    name: str
    amount: float
    category: str
    date: Optional[str] = None


class AnalyzePactRequest(BaseModel):
    title: str


# =========================
# DB helpers
# =========================
def get_conn(row_factory: bool = False) -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE)
    if row_factory:
        conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
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

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            spending_limit REAL NOT NULL,
            bet_amount REAL NOT NULL,
            anti_charity TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status TEXT DEFAULT 'active',
            payment_method_id TEXT,
            payment_status TEXT DEFAULT 'pending',
            stripe_payment_intent_id TEXT,
            stripe_customer_id TEXT,
            organization_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            stripe_account_id TEXT,
            category TEXT DEFAULT 'other',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS mock_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Backfill columns for older DBs
    alter_statements = [
        "ALTER TABLE contracts ADD COLUMN payment_method_id TEXT",
        "ALTER TABLE contracts ADD COLUMN payment_status TEXT DEFAULT 'pending'",
        "ALTER TABLE contracts ADD COLUMN stripe_payment_intent_id TEXT",
        "ALTER TABLE contracts ADD COLUMN stripe_customer_id TEXT",
        "ALTER TABLE contracts ADD COLUMN organization_id INTEGER",
    ]
    for stmt in alter_statements:
        try:
            conn.execute(stmt)
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()


def upsert_plaid_item(user_id: str, access_token: str, item_id: Optional[str]) -> None:
    conn = get_conn()
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
    conn.close()


def get_access_token(user_id: str) -> Optional[str]:
    conn = get_conn()
    row = conn.execute("SELECT access_token FROM plaid_items WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return row[0] if row else None


def get_mock_transactions() -> List[Dict[str, Any]]:
    conn = get_conn(row_factory=True)
    rows = conn.execute("SELECT * FROM mock_transactions ORDER BY date DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


# =========================
# Plaid / Stripe helpers
# =========================
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


def get_stripe_secret_key() -> str:
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        raise HTTPException(status_code=500, detail="Missing STRIPE_SECRET_KEY")
    return secret_key


def fetch_plaid_transactions(access_token: str, days: int = 90) -> List[Dict[str, Any]]:
    plaid_client = get_plaid_client()
    end_date = date.today()
    start_date = end_date - timedelta(days=max(1, min(days, 365)))

    transactions_request = TransactionsGetRequest(
        access_token=access_token,
        start_date=start_date,
        end_date=end_date,
        options=TransactionsGetRequestOptions(count=500),
    )
    response = plaid_client.transactions_get(transactions_request)

    transactions: List[Dict[str, Any]] = []
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
                "is_mock": False,
            }
        )

    return transactions


def seed_demo_organizations() -> None:
    conn = get_conn()
    existing = conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]
    if existing > 0:
        conn.close()
        return

    demo_orgs = [
        ("Red Cross", "International humanitarian organization", "charity"),
        ("Greenpeace", "Environmental activism organization", "environment"),
        ("UNICEF", "Children's rights and emergency relief", "charity"),
        ("Political Party A", "Political organization", "political"),
        ("Rival Football Club", "Sports organization", "sports"),
    ]

    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if stripe_key:
        stripe.api_key = stripe_key

    for name, desc, category in demo_orgs:
        stripe_account_id = None
        if stripe_key:
            try:
                account = stripe.Account.create(
                    type="express",
                    country="IE",
                    email=f"demo_{name.lower().replace(' ', '_')}@example.com",
                    capabilities={
                        "card_payments": {"requested": True},
                        "transfers": {"requested": True},
                    },
                    business_type="non_profit",
                    metadata={"demo": "true", "org_name": name},
                )
                stripe_account_id = account.id
                print(f"[STRIPE CONNECT] Created account for {name}: {stripe_account_id}")
            except stripe.error.StripeError as exc:
                print(f"[STRIPE CONNECT] Error creating account for {name}: {exc}")

        conn.execute(
            "INSERT INTO organizations (name, description, stripe_account_id, category) VALUES (?, ?, ?, ?)",
            (name, desc, stripe_account_id, category),
        )

    conn.commit()
    conn.close()


def update_contract_status(contract_dict: Dict[str, Any]) -> Dict[str, Any]:
    today = date.today()
    contract_end = datetime.fromisoformat(contract_dict["end_date"]).date()
    if contract_dict["status"] == "active" and today > contract_end:
        conn = get_conn()
        conn.execute("UPDATE contracts SET status = 'won' WHERE id = ?", (contract_dict["id"],))
        conn.commit()
        conn.close()
        contract_dict["status"] = "won"
    return contract_dict


def charge_contract(contract_dict: Dict[str, Any]) -> Dict[str, Any]:
    stripe.api_key = get_stripe_secret_key()
    amount_cents = int(contract_dict["bet_amount"] * 100)

    try:
        destination_account = None
        if contract_dict.get("organization_id"):
            conn = get_conn(row_factory=True)
            org = conn.execute(
                "SELECT stripe_account_id FROM organizations WHERE id = ?",
                (contract_dict["organization_id"],),
            ).fetchone()
            conn.close()
            if org and org["stripe_account_id"]:
                destination_account = org["stripe_account_id"]

        payment_params: Dict[str, Any] = {
            "amount": amount_cents,
            "currency": "eur",
            "customer": contract_dict.get("stripe_customer_id"),
            "payment_method": contract_dict["payment_method_id"],
            "confirm": True,
            "off_session": True,
            "description": f"Contract penalty: {contract_dict['category']} - {contract_dict['anti_charity']}",
            "metadata": {
                "contract_id": str(contract_dict["id"]),
                "anti_charity": contract_dict["anti_charity"],
                "category": contract_dict["category"],
            },
        }

        if destination_account:
            application_fee = int(amount_cents * 0.10)
            payment_params["transfer_data"] = {"destination": destination_account}
            payment_params["application_fee_amount"] = application_fee

        payment_intent = stripe.PaymentIntent.create(**payment_params)

        conn = get_conn()
        conn.execute(
            "UPDATE contracts SET payment_status = 'charged', stripe_payment_intent_id = ? WHERE id = ?",
            (payment_intent.id, contract_dict["id"]),
        )
        conn.commit()
        conn.close()

        return {"status": "charged", "payment_intent_id": payment_intent.id}
    except stripe.error.StripeError as exc:
        conn = get_conn()
        conn.execute("UPDATE contracts SET payment_status = 'failed' WHERE id = ?", (contract_dict["id"],))
        conn.commit()
        conn.close()
        return {"status": "failed", "error": str(exc)}


# =========================
# OpenAI roast generator
# =========================
_ROAST_STYLES = [
    "a disappointed Scandinavian parent — understated, cold, devastating",
    "a sarcastic best friend who saw this coming from miles away",
    "a dramatic Shakespearean narrator making this feel like a Greek tragedy",
    "a cold corporate CFO reading a quarterly loss report",
    "a tired life coach who has completely given up on this person",
    "an enthusiastic sports commentator calling the worst play of the season",
    "a passive-aggressive accountant who really enjoys their job right now",
    "a disappointed deity who expected better of humanity",
]


def generate_roast_script(user_name: str, failed_goal: str, amount: str, anti_charity: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return (
            f"{user_name}, you failed '{failed_goal}'. "
            f"Your {amount} is gone — {anti_charity} just got richer because of you. "
            "Try again, and mean it this time."
        )

    style = random.choice(_ROAST_STYLES)
    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=1.1,
            max_tokens=50,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are Morkis, a financial accountability monster. "
                        f"Speak as {style}. "
                        "Generate a spoken roast: EXACTLY 1 sentence, maximum 25 words. "
                        "Be specific and darkly funny. "
                        "You MUST mention: the person's name, what they failed at, "
                        "the euro amount lost, and who receives the money. "
                        "No stage directions, no quotation marks — just the spoken words."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Name: {user_name}\n"
                        f"Failed pact: {failed_goal}\n"
                        f"Amount lost: {amount}\n"
                        f"Money goes to: {anti_charity}"
                    ),
                },
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        print(f"[OPENAI] Roast generation failed: {exc}")
        return (
            f"{user_name}, you failed '{failed_goal}'. "
            f"Your {amount} now belongs to {anti_charity}. "
            "Congratulations on funding your enemy."
        )


# =========================
# Static pages
# =========================
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


# =========================
# ElevenLabs endpoint
# =========================
@app.post("/api/failure-roast")
def failure_roast(payload: RoastRequest):
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if not elevenlabs_key:
        return JSONResponse(status_code=500, content={"error": "ELEVENLABS_API_KEY is missing in environment"})

    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "ysswSXp8U9dFpzPJqFje")
    model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")

    # Generate a personalized, varied script with OpenAI
    text = generate_roast_script(
        user_name=payload.user_name,
        failed_goal=payload.failed_goal,
        amount=payload.amount,
        anti_charity=payload.anti_charity,
    )
    print(f"[ROAST] {text}")

    try:
        client = ElevenLabs(api_key=elevenlabs_key)
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


# =========================
# Pact analysis endpoint
# =========================
_VALID_CATEGORIES = [
    "FOOD_AND_DRINK", "COFFEE", "GENERAL_MERCHANDISE", "TRAVEL",
    "ENTERTAINMENT", "GROCERIES", "PERSONAL_CARE", "ALCOHOL_AND_BARS",
]

@app.post("/api/analyze-pact")
def analyze_pact(payload: AnalyzePactRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Fallback: return a generic config
        return {
            "categories": ["FOOD_AND_DRINK"],
            "merchantKeywords": [],
            "trackingLabel": payload.title,
        }

    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            max_tokens=200,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You analyze spending pacts for a financial accountability app. "
                        "Given a pact title, return ONLY a JSON object with these fields:\n"
                        "- categories: array from this exact list: "
                        + str(_VALID_CATEGORIES) + "\n"
                        "- merchantKeywords: lowercase strings to fuzzy-match against transaction merchant names. "
                        "Empty array if the pact covers ALL merchants in the category (e.g. 'no coffee at all'). "
                        "Include name variations and obvious competitors.\n"
                        "- trackingLabel: 2-5 word human label like 'Wolt & delivery apps' or 'All coffee shops'\n\n"
                        "Examples:\n"
                        "'No Wolt this week' → {\"categories\":[\"FOOD_AND_DRINK\"],\"merchantKeywords\":[\"wolt\",\"bolt food\",\"uber eats\",\"foodora\"],\"trackingLabel\":\"Wolt & delivery apps\"}\n"
                        "'No coffee' → {\"categories\":[\"COFFEE\",\"FOOD_AND_DRINK\"],\"merchantKeywords\":[],\"trackingLabel\":\"All coffee purchases\"}\n"
                        "'No H&M or Zara' → {\"categories\":[\"GENERAL_MERCHANDISE\"],\"merchantKeywords\":[\"h&m\",\"hm\",\"zara\"],\"trackingLabel\":\"H&M & Zara\"}"
                    ),
                },
                {
                    "role": "user",
                    "content": f"Pact: {payload.title}",
                },
            ],
        )
        import json as json_lib
        result = json_lib.loads(response.choices[0].message.content)
        # Validate categories
        result["categories"] = [c for c in result.get("categories", []) if c in _VALID_CATEGORIES]
        if not result["categories"]:
            result["categories"] = ["FOOD_AND_DRINK"]
        result["merchantKeywords"] = [k.lower() for k in result.get("merchantKeywords", [])]
        result["trackingLabel"] = result.get("trackingLabel", payload.title)[:60]
        return result
    except Exception as exc:
        print(f"[ANALYZE-PACT] Failed: {exc}")
        return {
            "categories": ["FOOD_AND_DRINK"],
            "merchantKeywords": [],
            "trackingLabel": payload.title,
        }


# =========================
# Plaid endpoints
# =========================
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

    try:
        transactions = fetch_plaid_transactions(access_token, days)

        # Merge mock transactions for test/debug parity with original project
        for mock in get_mock_transactions():
            transactions.append(
                {
                    "id": f"mock_{mock['id']}",
                    "name": mock["name"],
                    "amount": mock["amount"],
                    "date": mock["date"],
                    "primary_category": mock["category"],
                    "detailed_category": mock["category"],
                    "confidence": "MOCK",
                    "logo_url": None,
                    "is_mock": True,
                }
            )

        transactions.sort(key=lambda item: item["date"], reverse=True)
        return {"transactions": transactions}
    except plaid.ApiException as exc:
        raise HTTPException(status_code=500, detail=f"Plaid transactions failed: {exc}") from exc


@app.get("/api/plaid/status")
def plaid_status(user_id: str):
    return {"user_id": user_id, "has_access_token": bool(get_access_token(user_id))}


@app.delete("/api/plaid/disconnect")
def plaid_disconnect(user_id: str):
    conn = get_conn()
    conn.execute("DELETE FROM plaid_items WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"success": True}


# =========================
# Stripe + contracts endpoints
# =========================
@app.get("/api/stripe/config")
def stripe_config():
    return {"publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY")}


@app.get("/api/stripe/status")
def stripe_status():
    return {
        "configured": bool(os.getenv("STRIPE_SECRET_KEY")),
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY"),
    }


@app.post("/api/stripe/setup-intent")
def stripe_setup_intent():
    stripe.api_key = get_stripe_secret_key()
    try:
        setup_intent = stripe.SetupIntent.create(payment_method_types=["card"], usage="off_session")
        return {"client_secret": setup_intent.client_secret}
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=500, detail=f"Stripe setup intent failed: {exc}") from exc


@app.post("/api/stripe/test-charge")
def stripe_test_charge(payload: StripeTestChargeRequest):
    stripe.api_key = get_stripe_secret_key()
    amount_cents = int(round(payload.amount_eur * 100))
    if amount_cents < 50:
        raise HTTPException(status_code=400, detail="Minimum charge is 0.50 EUR")

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="eur",
            payment_method=payload.payment_method_id,
            confirm=True,
            description=payload.description,
            automatic_payment_methods={"enabled": False},
            payment_method_types=["card"],
        )
        return {
            "success": True,
            "payment_intent_id": payment_intent.id,
            "status": payment_intent.status,
            "amount": payment_intent.amount,
            "currency": payment_intent.currency,
        }
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=500, detail=f"Stripe test charge failed: {exc}") from exc


@app.get("/api/organizations")
def organizations():
    conn = get_conn(row_factory=True)
    rows = conn.execute("SELECT * FROM organizations ORDER BY name").fetchall()
    conn.close()
    return {"organizations": [dict(row) for row in rows]}


@app.get("/api/contracts")
def list_contracts():
    conn = get_conn(row_factory=True)
    rows = conn.execute("SELECT * FROM contracts ORDER BY created_at DESC").fetchall()
    conn.close()

    contracts = []
    for row in rows:
        contract = dict(row)
        contracts.append(update_contract_status(contract))

    return {"contracts": contracts}


@app.post("/api/contracts")
def create_contract(payload: ContractCreateRequest):
    anti_charity = payload.anti_charity
    if payload.organization_id:
        conn = get_conn(row_factory=True)
        org = conn.execute("SELECT name FROM organizations WHERE id = ?", (payload.organization_id,)).fetchone()
        conn.close()
        if org:
            anti_charity = org["name"]

    if not anti_charity:
        raise HTTPException(status_code=400, detail="Please select an organization or enter a name")

    start_date = date.today()
    end_date = start_date + timedelta(days=int(payload.duration_days))

    stripe_customer_id = None
    payment_status = "no_card"

    if payload.payment_method_id:
        stripe.api_key = get_stripe_secret_key()
        try:
            customer = stripe.Customer.create(
                description=f"Contract user - {payload.category}",
                metadata={"anti_charity": anti_charity},
            )
            stripe_customer_id = customer.id

            stripe.PaymentMethod.attach(payload.payment_method_id, customer=stripe_customer_id)
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={"default_payment_method": payload.payment_method_id},
            )
            payment_status = "card_saved"
        except stripe.error.StripeError as exc:
            raise HTTPException(status_code=400, detail=f"Payment setup failed: {exc}") from exc

    conn = get_conn()
    cursor = conn.execute(
        """
        INSERT INTO contracts (
            category, spending_limit, bet_amount, anti_charity,
            start_date, end_date, status, payment_method_id,
            payment_status, stripe_customer_id, organization_id
        )
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
        """,
        (
            payload.category,
            float(payload.spending_limit),
            float(payload.bet_amount),
            anti_charity,
            start_date.isoformat(),
            end_date.isoformat(),
            payload.payment_method_id,
            payment_status,
            stripe_customer_id,
            payload.organization_id,
        ),
    )
    conn.commit()
    contract_id = cursor.lastrowid
    conn.close()

    return {"success": True, "contract_id": contract_id, "payment_status": payment_status}


@app.delete("/api/contracts/{contract_id}")
def delete_contract(contract_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM contracts WHERE id = ?", (contract_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@app.get("/api/contracts/progress")
def contracts_progress(user_id: str, days: int = 90):
    access_token = get_access_token(user_id)
    if not access_token:
        raise HTTPException(status_code=404, detail="No Plaid access token for this user")

    conn = get_conn(row_factory=True)
    contracts = conn.execute("SELECT * FROM contracts WHERE status = 'active'").fetchall()

    if not contracts:
        conn.close()
        return {"contracts": []}

    try:
        transactions = fetch_plaid_transactions(access_token, days)

        # Match original behavior: merge mock transactions for local testing
        for mock in get_mock_transactions():
            transactions.append(
                {
                    "date": mock["date"],
                    "primary_category": mock["category"],
                    "amount": mock["amount"],
                }
            )

        today = date.today()
        result = []

        for row in contracts:
            contract = dict(row)
            contract_start = datetime.fromisoformat(contract["start_date"]).date()
            contract_end = datetime.fromisoformat(contract["end_date"]).date()

            spent = 0.0
            for txn in transactions:
                txn_date = datetime.fromisoformat(str(txn["date"]).split("T")[0]).date()
                txn_category = txn.get("primary_category", "OTHER")
                txn_amount = float(txn.get("amount", 0))

                if (
                    txn_amount > 0
                    and txn_category == contract["category"]
                    and contract_start <= txn_date <= min(contract_end, today)
                ):
                    spent += txn_amount

            contract["spent"] = round(spent, 2)
            contract["percentage"] = round((spent / contract["spending_limit"]) * 100, 1) if contract["spending_limit"] > 0 else 0
            contract["days_remaining"] = max(0, (contract_end - today).days)

            if spent > contract["spending_limit"] and contract["status"] == "active":
                contract["status"] = "lost"
                conn.execute("UPDATE contracts SET status = 'lost' WHERE id = ?", (contract["id"],))
                conn.commit()

                if contract.get("payment_method_id") and contract.get("payment_status") == "card_saved":
                    charge_result = charge_contract(contract)
                    contract["payment_status"] = charge_result["status"]
                    contract["charge_error"] = charge_result.get("error")
            elif today > contract_end and contract["status"] == "active":
                contract["status"] = "won"
                conn.execute("UPDATE contracts SET status = 'won' WHERE id = ?", (contract["id"],))
                conn.commit()

            result.append(contract)

        conn.close()
        return {"contracts": result}
    except plaid.ApiException as exc:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Contract progress failed: {exc}") from exc


# =========================
# Mock transaction endpoints
# =========================
@app.get("/api/mock-transactions")
def list_mock_transactions():
    return {"transactions": get_mock_transactions()}


@app.post("/api/mock-transactions")
def create_mock_transaction(payload: MockTransactionCreateRequest):
    txn_date = payload.date or date.today().isoformat()
    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO mock_transactions (name, amount, category, date) VALUES (?, ?, ?, ?)",
        (payload.name, float(payload.amount), payload.category, txn_date),
    )
    conn.commit()
    txn_id = cursor.lastrowid
    conn.close()
    return {"success": True, "transaction_id": txn_id}


@app.delete("/api/mock-transactions/{txn_id}")
def delete_mock_transaction(txn_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM mock_transactions WHERE id = ?", (txn_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@app.delete("/api/mock-transactions/clear")
def clear_mock_transactions():
    conn = get_conn()
    conn.execute("DELETE FROM mock_transactions")
    conn.commit()
    conn.close()
    return {"success": True}


# Initialize once at startup
init_db()
seed_demo_organizations()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
