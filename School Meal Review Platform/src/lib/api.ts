import { School, DailyMeal, Review, Meal, User } from "../types";

const API_BASE_URL = ""; // Use relative paths for Nginx proxy

export const api = {
  // Removed login function as it's handled by Supabase Auth on frontend

  async getMe(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  async updateUserSchool(token: string, schoolCode: string, officeCode: string, schoolName: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/school`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ school_code: schoolCode, office_code: officeCode, school_name: schoolName }),
      });
      if (!response.ok) throw new Error("Failed to update school");
      return await response.json();
    } catch (error) {
      console.error("Error updating user school:", error);
      return null;
    }
  },

  async getMyReviews(token: string): Promise<Review[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/reviews`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch my reviews");
      const data = await response.json();
      return mapBackendReviewsToFrontend(data.reviews);
    } catch (error) {
      console.error("Error fetching my reviews:", error);
      return [];
    }
  },

  async deleteReview(id: number, token: string): Promise<boolean> {
      try {
          const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
              method: "DELETE",
              headers: {
                  "Authorization": `Bearer ${token}`
              }
          });
          return response.ok;
      } catch (error) {
          console.error("Error deleting review:", error);
          return false;
      }
  },

  async searchSchools(query: string): Promise<School[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schools?name=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Failed to search schools");
      const data = await response.json();
      
      return data.schools.map((s: any) => ({
        id: s.SD_SCHUL_CODE,
        schoolCode: s.SD_SCHUL_CODE,
        officeCode: s.ATPT_OFCDC_SC_CODE,
        name: s.SCHUL_NM,
        address: s.ORG_RDNMA,
        averageRating: 0, 
      }));
    } catch (error) {
      console.error("Error searching schools:", error);
      return [];
    }
  },

  async getMeals(schoolCode: string, officeCode: string, date: string): Promise<DailyMeal> {
    try {
      const formattedDate = date.replace(/-/g, "");
      const response = await fetch(
        `${API_BASE_URL}/api/meals?school_code=${schoolCode}&office_code=${officeCode}&date=${formattedDate}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch meals");
      const data = await response.json();
      
      const meals: Meal[] = data.meals.map((m: any) => {
        let type: "breakfast" | "lunch" | "dinner" = "lunch";
        if (m.MMEAL_SC_NM === "조식") type = "breakfast";
        else if (m.MMEAL_SC_NM === "석식") type = "dinner";
        
        return {
          type,
          menu: m.parsed_dishes,
          calories: m.calories + " Kcal",
          nutrition: m.parsed_nutrition
        };
      });

      return {
        date,
        meals
      };
    } catch (error) {
      console.error("Error fetching meals:", error);
      return { date, meals: [] };
    }
  },

  async getReviews(schoolCode: string, officeCode: string, date?: string, mealType?: string): Promise<Review[]> {
    try {
      let url = `${API_BASE_URL}/api/reviews?school_code=${schoolCode}&office_code=${officeCode}`;
      if (date) url += `&meal_date=${date.replace(/-/g, "")}`;
      if (mealType) {
        const typeMap: Record<string, string> = {
          "breakfast": "조식",
          "lunch": "중식",
          "dinner": "석식"
        };
        url += `&meal_type=${typeMap[mealType] || mealType}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      
      return mapBackendReviewsToFrontend(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  },

  async createReview(review: Omit<Review, "id" | "createdAt" | "userId">, token: string): Promise<boolean> {
    try {
       const typeMap: Record<string, string> = {
          "breakfast": "조식",
          "lunch": "중식",
          "dinner": "석식"
        };

      const payload = {
        school_code: review.schoolCode,
        office_code: review.officeCode,
        meal_date: review.mealDate.replace(/-/g, ""),
        meal_type: typeMap[review.mealType],
        rating: review.rating,
        content: review.content
      };

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to create review:", errorData);
          alert(errorData.detail); 
          return false;
      }
      return true;
    } catch (error) {
      console.error("Error creating review:", error);
      alert("리뷰 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      return false;
    }
  },
  
  async getSchoolStats(schoolCode: string, officeCode: string) {
      try {
          const response = await fetch(`${API_BASE_URL}/api/stats?school_code=${schoolCode}&office_code=${officeCode}`);
          if (!response.ok) return { average_rating: 0, review_count: 0 };
          return await response.json();
      } catch (error) {
          console.error("Error fetching stats:", error);
          return { average_rating: 0, review_count: 0 };
      }
  }
};

function mapBackendReviewsToFrontend(reviews: any[]): Review[] {
    return reviews.map((r: any) => {
         let type: "breakfast" | "lunch" | "dinner" = "lunch";
         if (r.meal_type === "조식") type = "breakfast";
         else if (r.meal_type === "석식") type = "dinner";

         return {
            id: r.id,
            userId: r.user_id,
            schoolCode: r.school_code,
            officeCode: r.office_code,
            mealDate: r.meal_date,
            mealType: type,
            rating: r.rating,
            content: r.content,
            createdAt: r.created_at
         };
    });
}
