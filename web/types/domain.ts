export type ScreenId = "home" | "contract" | "orgs" | "shop" | "bite" | "sync";

export type MatchConfig = {
  categories: string[];
  merchantKeywords: string[];  // empty = match all merchants in categories
  trackingLabel: string;       // e.g. "Wolt & food delivery"
};

export type Pact = {
  id: string;
  title: string;
  stakeEuro: number;
  daysRemaining: number;
  status: "on_track" | "danger" | "completed" | "lost";
  progressPercent: number;
  // AI-inferred match config (new)
  matchConfig?: MatchConfig;
  // Legacy category field (kept for backwards compat with stored pacts)
  category?: string;
  spendingLimit?: number;
  spentEuro?: number;
  nemesis?: string;
};

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  isMock: boolean;
};

export type Organization = {
  id: string;
  name: string;
  type: string;
  iban: string;
  notes: string;
};

export type FailurePayload = {
  userName: string;
  failedGoal: string;
  amount: string;
  antiCharity: string;
  trigger?: string;
};
