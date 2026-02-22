import { API_BASE_URL } from "@/lib/config";
import type { FailurePayload, MatchConfig } from "@/types/domain";

export async function fetchFailureRoast(payload: FailurePayload): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/failure-roast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_name: payload.userName,
      failed_goal: payload.failedGoal,
      amount: payload.amount,
      anti_charity: payload.antiCharity,
    })
  });

  if (!response.ok) {
    const fallback = `Roast request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string; detail?: string };
      throw new Error(body.error || body.detail || fallback);
    } catch {
      throw new Error(fallback);
    }
  }

  return response.blob();
}

export async function analyzePact(title: string): Promise<MatchConfig> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-pact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("analyze-pact failed");
  return response.json() as Promise<MatchConfig>;
}
