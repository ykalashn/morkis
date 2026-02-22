"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type PlaidHandler = {
  open: () => void;
};

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (public_token: string) => void;
        onExit?: (error: unknown, metadata: unknown) => void;
      }) => PlaidHandler;
    };
  }
}

export default function PlaidTestPage() {
  const [userId, setUserId] = useState("test-user-1");
  const [days, setDays] = useState(90);
  const [publicToken, setPublicToken] = useState("");
  const [linkToken, setLinkToken] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [output, setOutput] = useState("No request yet.");
  const handlerRef = useRef<PlaidHandler | null>(null);

  useEffect(() => {
    if (window.Plaid) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setOutput("Failed to load Plaid SDK script.");
    document.body.appendChild(script);
  }, []);

  async function runRequest(path: string, init?: RequestInit) {
    try {
      const response = await fetch(`${API_BASE}${path}`, init);
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        setOutput(JSON.stringify({ status: response.status, body: json }, null, 2));
      } catch {
        setOutput(`status=${response.status}\n${text}`);
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async function createLinkTokenRequest(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/api/plaid/create_link_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });

      const body = (await response.json()) as { link_token?: string; detail?: string };
      if (!response.ok || !body.link_token) {
        setOutput(JSON.stringify({ status: response.status, body }, null, 2));
        return null;
      }

      setLinkToken(body.link_token);
      setOutput(JSON.stringify({ status: response.status, body }, null, 2));
      return body.link_token;
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Unknown error");
      return null;
    }
  }

  async function exchangeToken(token: string) {
    await runRequest("/api/plaid/exchange_public_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, public_token: token })
    });
  }

  async function connectWithPlaid() {
    if (!sdkReady || !window.Plaid) {
      setOutput("Plaid SDK is not ready yet.");
      return;
    }

    setIsConnecting(true);
    const token = linkToken || (await createLinkTokenRequest());
    if (!token) {
      setIsConnecting(false);
      return;
    }

    handlerRef.current = window.Plaid.create({
      token,
      onSuccess: async (tokenFromLink) => {
        setPublicToken(tokenFromLink);
        await exchangeToken(tokenFromLink);
        setIsConnecting(false);
      },
      onExit: () => {
        setIsConnecting(false);
      }
    });
    handlerRef.current.open();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="font-[var(--font-display)] text-4xl font-extrabold text-ink">Plaid Test Console</h1>
      <p className="text-sm text-ink/60">Use this page to verify your Plaid backend wiring quickly.</p>

      <section className="morkis-card space-y-4 p-5">
        <label className="block text-sm font-semibold text-ink/80">
          User ID
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-ink/10 px-3 py-2"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="morkis-button bg-moss px-4 py-2 text-xs uppercase tracking-widest text-white"
            onClick={() => runRequest(`/api/plaid/status?user_id=${encodeURIComponent(userId)}`)}
          >
            Check Status
          </button>

          <button
            type="button"
            className="morkis-button bg-moss px-4 py-2 text-xs uppercase tracking-widest text-white"
            onClick={() => void createLinkTokenRequest()}
          >
            Create Link Token
          </button>

          <button
            type="button"
            className="morkis-button bg-ink px-4 py-2 text-xs uppercase tracking-widest text-white"
            onClick={() => void connectWithPlaid()}
            disabled={!sdkReady || isConnecting}
          >
            {isConnecting ? "Opening Plaid..." : "Connect With Plaid"}
          </button>
        </div>
        {linkToken ? (
          <p className="font-[var(--font-mono)] text-xs text-muted">
            Current link token: <span className="break-all">{linkToken}</span>
          </p>
        ) : null}
      </section>

      <section className="morkis-card space-y-4 p-5">
        <label className="block text-sm font-semibold text-ink/80">
          Public Token (from Plaid Link)
          <input
            value={publicToken}
            onChange={(event) => setPublicToken(event.target.value)}
            placeholder="public-sandbox-..."
            className="mt-1 w-full rounded-lg border-2 border-ink/10 px-3 py-2"
          />
        </label>

        <button
          type="button"
          className="morkis-button bg-coral px-4 py-2 text-xs uppercase tracking-widest text-white"
          onClick={() => void exchangeToken(publicToken)}
        >
          Exchange Public Token
        </button>
      </section>

      <section className="morkis-card space-y-4 p-5">
        <label className="block text-sm font-semibold text-ink/80">
          Days
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(Number(event.target.value) || 90)}
            className="mt-1 w-full rounded-lg border-2 border-ink/10 px-3 py-2"
          />
        </label>

        <button
          type="button"
          className="morkis-button bg-ink px-4 py-2 text-xs uppercase tracking-widest text-white"
          onClick={() => runRequest(`/api/plaid/transactions?user_id=${encodeURIComponent(userId)}&days=${days}`)}
        >
          Get Transactions
        </button>
      </section>

      <section className="morkis-card p-5">
        <p className="mb-2 font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-ink/60">Response</p>
        <pre className="max-h-[420px] overflow-auto rounded-lg bg-cream p-4 text-xs text-ink">{output}</pre>
      </section>
    </main>
  );
}
