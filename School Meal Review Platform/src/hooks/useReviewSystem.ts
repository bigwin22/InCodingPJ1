import { useState, useCallback } from "react";
import { School } from "../types";
import { api } from "../lib/api";
import { formatDate } from "../lib/dateUtils";

type MealType = "breakfast" | "lunch" | "dinner";

export function useReviewSystem(
  selectedSchool: School | null,
  currentDate: Date,
  onReviewSubmitted: () => void
) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);

  const openReviewDialog = useCallback((mealType: MealType) => {
    setSelectedMealType(mealType);
    setReviewDialogOpen(true);
  }, []);

  const submitReview = useCallback(async (rating: number, comment: string, token: string) => {
    if (!selectedSchool || !selectedMealType) return;

    const formattedDate = formatDate(currentDate);

    const success = await api.createReview({
      schoolCode: selectedSchool.schoolCode,
      officeCode: selectedSchool.officeCode,
      mealDate: formattedDate,
      mealType: selectedMealType,
      rating,
      content: comment,
    }, token);

    if (success) {
      alert("리뷰가 등록되었습니다!");
      setReviewDialogOpen(false);
      setSelectedMealType(null);
      onReviewSubmitted();
    } else {
      // The alert for failure is now handled in api.createReview for more specific messages, 
      // but keeping a generic fallback here is fine or just relying on api.
      // Since I added alert in api.ts, I can remove it here or keep it.
    }
  }, [selectedSchool, selectedMealType, currentDate, onReviewSubmitted]);

  return {
    reviewDialogOpen,
    setReviewDialogOpen,
    selectedMealType,
    openReviewDialog,
    submitReview
  };
}