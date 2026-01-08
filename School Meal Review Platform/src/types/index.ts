export interface School {
  id: string;
  name: string;
  address: string;
  averageRating: number;
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner";
  menu: string[];
  calories?: string;
}

export interface DailyMeal {
  date: string;
  meals: Meal[];
}

export interface Review {
  id: string;
  schoolId: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner";
  rating: number;
  comment?: string;
  userId: string;
  createdAt: string;
}
