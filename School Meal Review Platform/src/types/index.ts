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
  schoolCode: string;
  officeCode: string;
  mealDate: string;
  mealType: "breakfast" | "lunch" | "dinner";
  rating: number;
  content: string;
  createdAt: string;
}