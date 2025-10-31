export type Coords = { lat: number; lng: number };

export type PlanInput = {
  destination: string;
  startDate: string;
  endDate: string;
  budgetCNY: number;
  people: number;
  preferences: string; // free text, can come from voice
  startAddress?: string; // optional start point address
  start?: Coords; // optional start point coordinates (from geolocation or geocode)
  includeBudget?: boolean; // whether to ask AI for budget analysis
};

export type ItineraryPlace = {
  name: string;
  address?: string;
  time?: string;
  notes?: string;
  lat?: number;
  lng?: number;
};

export type ItineraryDay = {
  date: string;
  activities: ItineraryPlace[];
  hotel?: string;
};

export type Itinerary = {
  destination: string;
  days: ItineraryDay[];
  summary?: string;
  start?: { address?: string; lat?: number; lng?: number };
  budget?: {
    currency: string; // e.g. CNY
    total: number;
    breakdown: {
      transportation?: number;
      lodging?: number;
      food?: number;
      tickets?: number;
      shopping?: number;
      misc?: number;
    };
    notes?: string;
  };
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number; // CNY
  notes?: string;
};

export type Provider = 'dashscope' | 'openai';