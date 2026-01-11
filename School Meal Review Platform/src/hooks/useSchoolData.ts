import { useState, useEffect, useCallback } from "react";
import { School, DailyMeal, Review } from "../types";
import { api } from "../lib/api";
import { formatDate } from "../lib/dateUtils";

export function useSchoolData(selectedSchool: School | null, currentDate: Date) {
  const [dailyMeal, setDailyMeal] = useState<DailyMeal | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedSchool) {
      setDailyMeal(null);
      setReviews([]);
      setAverageRating(0);
      return;
    }

    setIsLoadingData(true);
    const formattedDate = formatDate(currentDate);

    try {
      const [mealsData, reviewsData, stats] = await Promise.all([
        api.getMeals(selectedSchool.schoolCode, selectedSchool.officeCode, formattedDate),
        api.getReviews(selectedSchool.schoolCode, selectedSchool.officeCode, formattedDate),
        api.getSchoolStats(selectedSchool.schoolCode, selectedSchool.officeCode),
      ]);

      setDailyMeal(mealsData);
      setReviews(reviewsData);
      setAverageRating(stats.average_rating);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedSchool, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshReviews = useCallback(async () => {
    if (!selectedSchool) return;
    const formattedDate = formatDate(currentDate);
    
    const [updatedReviews, updatedStats] = await Promise.all([
      api.getReviews(selectedSchool.schoolCode, selectedSchool.officeCode, formattedDate),
      api.getSchoolStats(selectedSchool.schoolCode, selectedSchool.officeCode),
    ]);

    setReviews(updatedReviews);
    setAverageRating(updatedStats.average_rating);
  }, [selectedSchool, currentDate]);

  return {
    dailyMeal,
    reviews,
    averageRating,
    isLoadingData,
    refreshReviews
  };
}
