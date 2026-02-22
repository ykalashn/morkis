export type ScreenId = "home" | "contract" | "orgs" | "shop" | "bite";

export type Pact = {
  id: string;
  title: string;
  stakeEuro: number;
  daysRemaining: number;
  status: "on_track" | "danger";
  progressPercent: number;
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
};
