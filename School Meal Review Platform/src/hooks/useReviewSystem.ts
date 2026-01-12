import { useState, useCallback, useMemo } from "react";
import { School, Review } from "../types";
import { api } from "../lib/api";
import { formatDate } from "../lib/dateUtils";

type MealType = "breakfast" | "lunch" | "dinner";

export function useReviewSystem(
  selectedSchool: School | null,
  currentDate: Date,
  onReviewSubmitted: () => void,
  reviews: Review[] = [],
  userId?: string
) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openReviewDialog = useCallback((mealType: MealType) => {
    setSelectedMealType(mealType);
    setReviewDialogOpen(true);
  }, []);

  const existingReview = useMemo(() => {
    if (!selectedMealType || !userId) return null;
    return reviews.find(r => r.mealType === selectedMealType && r.userId === userId) || null;
  }, [reviews, selectedMealType, userId]);

  const submitReview = useCallback(async (rating: number, comment: string, token: string) => {
    if (!selectedSchool || !selectedMealType) return;

    setIsSubmitting(true);
    const formattedDate = formatDate(currentDate);

    try {
      const success = await api.createReview({
        schoolCode: selectedSchool.schoolCode,
        officeCode: selectedSchool.officeCode,
        mealDate: formattedDate,
        mealType: selectedMealType,
        rating,
        content: comment,
      }, token);

      if (success) {
        alert(existingReview ? "리뷰가 수정되었습니다!" : "리뷰가 등록되었습니다!");
        setReviewDialogOpen(false);
        setSelectedMealType(null);
        onReviewSubmitted();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSchool, selectedMealType, currentDate, onReviewSubmitted, existingReview]);

  return {
    reviewDialogOpen,
    setReviewDialogOpen,
    selectedMealType,
    existingReview,
    isSubmitting,
    openReviewDialog,
    submitReview
  };
}