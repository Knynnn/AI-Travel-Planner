export type PlanInput = {
  destination: string;
  startDate: string;
  endDate: string;
  budgetCNY: number;
  people: number;
  preferences: string; // free text, can come from voice
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
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number; // CNY
  notes?: string;
};

export type Provider = 'dashscope' | 'openai';