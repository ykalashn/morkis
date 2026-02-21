import { API_BASE_URL } from "@/lib/config";
import type { FailurePayload } from "@/types/domain";

export async function fetchFailureRoast(payload: FailurePayload): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/failure-roast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_name: payload.userName,
      failed_goal: payload.failedGoal,
      amount: payload.amount
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
