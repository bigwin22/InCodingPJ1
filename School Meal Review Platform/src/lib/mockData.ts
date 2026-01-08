import { School, DailyMeal, Review } from "../types";

export const mockSchools: School[] = [
  {
    id: "school-1",
    name: "서울고등학교",
    address: "서울특별시 서초구 서초동",
    averageRating: 4.2,
  },
  {
    id: "school-2",
    name: "서울중학교",
    address: "서울특별시 강남구 역삼동",
    averageRating: 3.8,
  },
  {
    id: "school-3",
    name: "서울초등학교",
    address: "서울특별시 송파구 잠실동",
    averageRating: 4.5,
  },
];

// 날짜를 YYYY-MM-DD 형식으로 변환하는 유틸리티 함수
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 주말을 건너뛰고 다음 평일을 찾는 함수
export function getNextWeekday(date: Date): Date {
  const nextDate = new Date(date);
  const dayOfWeek = nextDate.getDay();
  
  // 토요일(6)이면 월요일로 이동
  if (dayOfWeek === 6) {
    nextDate.setDate(nextDate.getDate() + 2);
  }
  // 일요일(0)이면 월요일로 이동
  else if (dayOfWeek === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

// 주말을 건너뛰고 이전 평일을 찾는 함수
export function getPreviousWeekday(date: Date): Date {
  const prevDate = new Date(date);
  const dayOfWeek = prevDate.getDay();
  
  // 월요일(1)이면 금요일로 이동
  if (dayOfWeek === 1) {
    prevDate.setDate(prevDate.getDate() - 3);
  }
  // 일요일(0)이면 금요일로 이동
  else if (dayOfWeek === 0) {
    prevDate.setDate(prevDate.getDate() - 2);
  }
  // 토요일(6)이면 금요일로 이동
  else if (dayOfWeek === 6) {
    prevDate.setDate(prevDate.getDate() - 1);
  }
  
  return prevDate;
}

export function generateMockMeals(schoolId: string, date: string): DailyMeal {
  const menus = {
    breakfast: [
      ["쌀밥", "미역국", "계란후라이", "김치", "우유"],
      ["토스트", "시리얼", "우유", "과일샐러드"],
      ["쌀밥", "된장찌개", "생선구이", "김치", "과일"],
    ],
    lunch: [
      ["흰밥", "김치찌개", "돈까스", "샐러드", "김치", "과일"],
      ["카레라이스", "치킨너겟", "단무지", "요구르트"],
      ["비빔밥", "미역국", "만두", "김치", "식혜"],
      ["짜장면", "탕수육", "단무지", "우유"],
      ["제육볶음", "흰밥", "된장국", "김치", "과일"],
    ],
    dinner: [
      ["흰밥", "순두부찌개", "제육볶음", "김치", "과일"],
      ["볶음밥", "짬뽕국", "군만두", "단무지"],
      ["흰밥", "삼계탕", "배추김치", "깍두기"],
    ],
  };

  const randomIndex = (arr: any[]) => Math.floor(Math.random() * arr.length);

  return {
    date,
    meals: [
      {
        type: "breakfast",
        menu: menus.breakfast[randomIndex(menus.breakfast)],
        calories: "650kcal",
      },
      {
        type: "lunch",
        menu: menus.lunch[randomIndex(menus.lunch)],
        calories: "850kcal",
      },
      {
        type: "dinner",
        menu: menus.dinner[randomIndex(menus.dinner)],
        calories: "750kcal",
      },
    ],
  };
}

export function generateMockReviews(schoolId: string, date: string): Review[] {
  const reviews: Review[] = [];
  const mealTypes: ("breakfast" | "lunch" | "dinner")[] = ["breakfast", "lunch", "dinner"];
  
  // 각 식사당 1-3개의 리뷰 생성
  mealTypes.forEach((mealType) => {
    const reviewCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < reviewCount; i++) {
      reviews.push({
        id: `review-${schoolId}-${date}-${mealType}-${i}`,
        schoolId,
        date,
        mealType,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: i === 0 ? ["맛있어요!", "괜찮네요", "별로예요", "최고!"][Math.floor(Math.random() * 4)] : undefined,
        userId: `user-${Math.floor(Math.random() * 100)}`,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return reviews;
}

// 학교 검색 함수
export function searchSchools(query: string): School[] {
  const normalizedQuery = query.toLowerCase().replace(/\s/g, "");
  return mockSchools.filter((school) =>
    school.name.toLowerCase().replace(/\s/g, "").includes(normalizedQuery)
  );
}
