// Tipos de domínio como uniões de string (espelham os enums do Prisma).
// O domínio não depende do Prisma: pode ser testado e reutilizado isoladamente.

export type TravelPreference = "CHOSEN_CITIES" | "KM_20" | "KM_50" | "ANY";
export type OpportunityType = "SINGLE" | "RECURRING" | "TEMPORARY" | "FIXED";
export type OpportunityStatus = "OPEN" | "FILLED" | "CLOSED" | "CANCELLED";
export type ApplicationStatus =
  | "SENT"
  | "VIEWED"
  | "IN_REVIEW"
  | "SELECTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";
export type ContractStatus = "ACTIVE" | "AWAITING_CONFIRMATION" | "COMPLETED" | "CANCELLED";
export type AvailabilityKind = "AVAILABLE" | "UNAVAILABLE";
export type ExperienceLevel = "NONE" | "INFORMAL" | "PROFESSIONAL";
export type PayUnit = "SHIFT" | "HOUR" | "MONTH" | "TOTAL";

export type CityPoint = { id: string; lat: number; lng: number };

export type FreelancerReach = {
  mainCityId: string | null;
  workCityIds: string[];
  travel: TravelPreference;
};

export type OpportunitySchedule = {
  type: OpportunityType;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
  recurrenceDays: number[]; // 0 = domingo
  startTime: string | null; // HH:MM
  endTime: string | null;
};

export type AvailabilitySlot = {
  kind: AvailabilityKind;
  weekday: number | null;
  date: string | null; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
};
