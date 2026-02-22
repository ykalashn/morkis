export type ScreenId = "home" | "contract" | "orgs" | "shop" | "bite" | "sync";

export type Pact = {
  id: string;
  title: string;
  stakeEuro: number;
  daysRemaining: number;
  status: "on_track" | "danger" | "completed" | "lost";
  progressPercent: number;
  // Transaction sync fields (populated after first sync)
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
