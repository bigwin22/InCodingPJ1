import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SearchBar } from "../components/SearchBar";
import { DateNavigation } from "../components/DateNavigation";
import { MealCard } from "../components/MealCard";
import { SchoolInfo } from "../components/SchoolInfo";
import { ReviewDialog } from "../components/ReviewDialog";
import { ReviewList } from "../components/ReviewList";
import { getNextWeekday } from "../lib/dateUtils";
import { UtensilsCrossed, Settings, User as UserIcon, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useSchoolSearch } from "../hooks/useSchoolSearch";
import { useSchoolData } from "../hooks/useSchoolData";
import { useReviewSystem } from "../hooks/useReviewSystem";
import { Meal, School } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { LoginButton } from "../components/LoginButton";
import { Button } from "../components/ui/button";
import { SchoolSettings } from "../components/SchoolSettings";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export function MealHome() {
  const { user, logout, token, isLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(getNextWeekday(new Date()));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const lastUserSchoolCode = useRef<string | null | undefined>(undefined);

  // Custom Hooks
  const { 
    isSearching, 
    selectedSchool, 
    setSelectedSchool,
    searchSchool 
  } = useSchoolSearch();

  const { 
    dailyMeal, 
    reviews, 
    averageRating, 
    isLoadingData, 
    refreshReviews 
  } = useSchoolData(selectedSchool, currentDate);

  const {
    reviewDialogOpen,
    setReviewDialogOpen,
    selectedMealType,
    existingReview,
    isSubmitting,
    openReviewDialog,
    submitReview
  } = useReviewSystem(selectedSchool, currentDate, refreshReviews, reviews, user?.id);

  // Auto-select user's school on login or when school_code changes
  useEffect(() => {
    const loadUserSchool = async () => {
      // 인증 로딩 중이면 대기
      if (isLoading) {
        console.log("Auth loading, waiting...");
        return;
      }

      // 로그인하지 않은 경우
      if (!user) {
        lastUserSchoolCode.current = undefined;
        return;
      }

      // 학교 코드가 변경되지 않았으면 다시 로드하지 않음
      const currentSchoolCode = user.school_code || null;
      
      // 학교 정보가 있다가 없어지는 경우는 무시 (재인증/동기화 중 일시적 상태일 가능성 높음)
      if (lastUserSchoolCode.current && !currentSchoolCode) {
         console.log("School code temporarily missing, skipping update");
         return;
      }

      if (lastUserSchoolCode.current !== undefined && currentSchoolCode === lastUserSchoolCode.current) {
        console.log("School code unchanged, skipping load");
        return;
      }

      // 학교 코드 업데이트
      console.log("School code changed:", lastUserSchoolCode.current, "->", currentSchoolCode);
      lastUserSchoolCode.current = currentSchoolCode;

      // 학교가 설정되어 있는 경우
      if (user.school_code && user.school_name) {
        console.log("Loading user school:", user.school_name);
        try {
           const results = await api.searchSchools(user.school_name);
           const match = results.find(s => s.schoolCode === user.school_code);
           if (match) {
             setSelectedSchool(match);
             console.log("User school loaded:", match.name);
           }
        } catch (e) {
          console.error("Failed to load user school", e);
        }
      } else {
        // 이전에 학교 설정이 없었고 지금도 없는 경우에만 모달 표시
        console.log("No school set, opening settings modal");
        setSettingsOpen(true);
      }
    };
    loadUserSchool();
  }, [user, isLoading, setSelectedSchool]);

  // Handlers wrapped in useCallback
  const handleSearch = useCallback((schoolName: string) => {
    searchSchool(schoolName, setCurrentDate);
  }, [searchSchool]);

  const handleReviewClick = (type: "breakfast" | "lunch" | "dinner") => {
      if (!user) {
          alert("리뷰를 작성하려면 로그인이 필요합니다.");
          return;
      }
      if (selectedSchool?.schoolCode !== user.school_code) {
          alert("본인의 학교에만 리뷰를 작성할 수 있습니다.");
          return;
      }
      openReviewDialog(type);
  };

  const handleSubmitReview = async (rating: number, content: string) => {
      if (!token) return;
      await submitReview(rating, content, token);
  };

  const handleSchoolSelected = (school: School) => {
      console.log("School selected:", school.name);
      setSelectedSchool(school);
  };

  // Memoized stats calculation
  const getMealStats = useCallback((mealType: "breakfast" | "lunch" | "dinner") => {
    const mealReviews = reviews.filter(r => r.mealType === mealType);
    const avg = mealReviews.length > 0
      ? mealReviews.reduce((sum, r) => sum + r.rating, 0) / mealReviews.length
      : 0;
    return { averageRating: avg, reviewCount: mealReviews.length };
  }, [reviews]);

  // Memoize the SchoolInfo component props
  const schoolInfoProps = useMemo(() => {
    if (!selectedSchool) return null;
    return { ...selectedSchool, averageRating };
  }, [selectedSchool, averageRating]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
                <UtensilsCrossed className="size-6 sm:size-8 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold">학교 급식 정보</h1>
            </div>
            
            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        <span className="text-sm font-medium mr-2 hidden sm:inline">{user.name}님</span>
                        <Button variant="ghost" size="icon" onClick={() => navigate("/mypage")} title="마이페이지">
                            <UserIcon className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} title="학교 설정">
                            <Settings className="size-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={logout} title="로그아웃">
                            <LogOut className="size-5" />
                        </Button>
                    </>
                ) : (
                    <LoginButton />
                )}
            </div>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {selectedSchool && schoolInfoProps ? (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* 학교 정보 */}
            <SchoolInfo school={schoolInfoProps} />

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
                로그인 후 학교를 설정하면 내 학교의 급식을 바로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 리뷰 작성 다이얼로그 */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onSubmit={handleSubmitReview}
        mealType={selectedMealType}
        existingReview={existingReview}
        isSubmitting={isSubmitting}
      />

      {/* Settings Dialog */}
      <SchoolSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSchoolSelected={handleSchoolSelected}
        mustSelect={user ? !user.school_code : false}
      />
    </div>
  );
}
