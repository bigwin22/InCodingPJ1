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

  const submitReview = useCallback(async (rating: number, comment: string) => {
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
      onReviewSubmitted();
    } else {
      alert("리뷰 등록에 실패했습니다.");
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
