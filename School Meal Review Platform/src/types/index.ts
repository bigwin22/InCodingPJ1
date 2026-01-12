export interface School {
  id: string; // We will use SD_SCHUL_CODE as the ID
  schoolCode: string;
  officeCode: string;
  name: string;
  address: string;
  averageRating?: number;
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner";
  menu: string[];
  calories: string;
  nutrition?: Record<string, string>;
}

export interface DailyMeal {
  date: string;
  meals: Meal[];
}

export interface Review {
  id: number;
  userId: string;
  schoolCode: string;
  officeCode: string;
  mealDate: string;
  mealType: "breakfast" | "lunch" | "dinner";
  rating: number;
  content: string;
  createdAt: string;
}

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  school_code?: string;
  office_code?: string;
  school_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}