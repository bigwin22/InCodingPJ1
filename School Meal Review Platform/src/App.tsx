import { useState, useEffect } from "react";
import { SearchBar } from "./components/SearchBar";
import { DateNavigation } from "./components/DateNavigation";
import { MealCard } from "./components/MealCard";
import { SchoolInfo } from "./components/SchoolInfo";
import { ReviewDialog } from "./components/ReviewDialog";
import { ReviewList } from "./components/ReviewList";
import { School, Meal, DailyMeal, Review } from "./types";
import { api } from "./lib/api";
import { formatDate, getNextWeekday } from "./lib/dateUtils";
import { UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

export default function App() {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(getNextWeekday(new Date()));
  const [isSearching, setIsSearching] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | null>(null);
  
  // Data states
  const [dailyMeal, setDailyMeal] = useState<DailyMeal | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch meals and reviews when school or date changes
  useEffect(() => {
    async function fetchData() {
      if (!selectedSchool) {
        setDailyMeal(null);
        setReviews([]);
        return;
      }

      setIsLoadingData(true);
      const formattedDate = formatDate(currentDate);
      
      try {
        const [mealsData, reviewsData] = await Promise.all([
          api.getMeals(selectedSchool.schoolCode, selectedSchool.officeCode, formattedDate),
          api.getReviews(selectedSchool.schoolCode, selectedSchool.officeCode, formattedDate)
        ]);
        
        setDailyMeal(mealsData);
        setReviews(reviewsData);
        
        // Update stats if needed (optional optimization)
        // const stats = await api.getSchoolStats(selectedSchool.schoolCode, selectedSchool.officeCode);
        // setSelectedSchool(prev => prev ? { ...prev, averageRating: stats.average_rating } : null);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [selectedSchool, currentDate]);

  const handleSearch = async (schoolName: string) => {
    setIsSearching(true);
    try {
      const results = await api.searchSchools(schoolName);
      if (results.length > 0) {
        setSelectedSchool(results[0]);
        // Set date to next weekday (or today if it's a weekday)
        setCurrentDate(getNextWeekday(new Date()));
      } else {
        setSelectedSchool(null);
        alert("검색 결과가 없습니다.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReviewClick = (mealType: "breakfast" | "lunch" | "dinner") => {
    setSelectedMealType(mealType);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedSchool || !selectedMealType) return;

    const formattedDate = formatDate(currentDate);
    
    const success = await api.createReview({
      schoolCode: selectedSchool.schoolCode,
      officeCode: selectedSchool.officeCode,
      mealDate: formattedDate,
      mealType: selectedMealType,
      rating,
      content: comment,
    });

    if (success) {
      alert("리뷰가 등록되었습니다!");
      setReviewDialogOpen(false);
      setSelectedMealType(null);
      
      // Refresh reviews
      const updatedReviews = await api.getReviews(
        selectedSchool.schoolCode, 
        selectedSchool.officeCode, 
        formattedDate
      );
      setReviews(updatedReviews);
    } else {
      alert("리뷰 등록에 실패했습니다.");
    }
  };

  // Calculate stats for current view
  const getMealStats = (mealType: "breakfast" | "lunch" | "dinner") => {
    const mealReviews = reviews.filter(r => r.mealType === mealType);
    const averageRating = mealReviews.length > 0
      ? mealReviews.reduce((sum, r) => sum + r.rating, 0) / mealReviews.length
      : 0;
    return { averageRating, reviewCount: mealReviews.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <UtensilsCrossed className="size-6 sm:size-8 text-primary" />
            <h1 className="text-xl sm:text-2xl">학교 급식 정보</h1>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {selectedSchool ? (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* 학교 정보 */}
            <SchoolInfo school={selectedSchool} />

            {/* 날짜 네비게이션 */}
            <DateNavigation
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />

            {/* 급식 카드 그리드 */}
            {isLoadingData ? (
               <div className="text-center py-12">
                 <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                 <p className="text-muted-foreground">급식 정보를 불러오는 중...</p>
               </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {dailyMeal?.meals && dailyMeal.meals.length > 0 ? (
                    dailyMeal.meals.map((meal: Meal) => {
                      const stats = getMealStats(meal.type);
                      return (
                        <MealCard
                          key={meal.type}
                          meal={meal}
                          averageRating={stats.averageRating}
                          reviewCount={stats.reviewCount}
                          onReviewClick={() => handleReviewClick(meal.type)}
                        />
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border">
                      <p>해당 날짜의 급식 정보가 없습니다.</p>
                    </div>
                  )}
                </div>

                {/* 리뷰 탭 */}
                <Tabs defaultValue="lunch" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="breakfast" className="text-xs sm:text-sm">조식 리뷰</TabsTrigger>
                    <TabsTrigger value="lunch" className="text-xs sm:text-sm">중식 리뷰</TabsTrigger>
                    <TabsTrigger value="dinner" className="text-xs sm:text-sm">석식 리뷰</TabsTrigger>
                  </TabsList>
                  <TabsContent value="breakfast" className="mt-4">
                    <ReviewList reviews={reviews} mealType="breakfast" />
                  </TabsContent>
                  <TabsContent value="lunch" className="mt-4">
                    <ReviewList reviews={reviews} mealType="lunch" />
                  </TabsContent>
                  <TabsContent value="dinner" className="mt-4">
                    <ReviewList reviews={reviews} mealType="dinner" />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-12 sm:py-20">
            <div className="bg-muted/30 rounded-lg p-8 sm:p-12">
              <UtensilsCrossed className="size-12 sm:size-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="mb-2 text-lg sm:text-xl">학교를 검색해주세요</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                학교명을 입력하면 급식 정보를 확인할 수 있습니다
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 리뷰 작성 다이얼로그 */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onSubmit={handleReviewSubmit}
        mealType={selectedMealType}
      />
    </div>
  );
}
