"use client";

export const PLAID_USER_ID = "morkis_demo_user";

interface PlaidConnectButtonProps {
  onSuccess: () => void;
}

export function PlaidConnectButton({ onSuccess }: PlaidConnectButtonProps) {
  function handleClick() {
    // In production this would open the Plaid Link flow.
    // For the prototype, just simulate a successful connection.
    onSuccess();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-cream px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
    >
      Connect Bank (Plaid)
    </button>
  );
}
