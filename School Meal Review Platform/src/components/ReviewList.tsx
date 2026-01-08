import { Card } from "./ui/card";
import { Star, User } from "lucide-react";
import { Review } from "../types";

interface ReviewListProps {
  reviews: Review[];
  mealType: "breakfast" | "lunch" | "dinner";
}

export function ReviewList({ reviews, mealType }: ReviewListProps) {
  const mealReviews = reviews.filter(r => r.mealType === mealType);

  const mealTypeLabels = {
    breakfast: "조식",
    lunch: "중식",
    dinner: "석식",
  };

  if (mealReviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>아직 {mealTypeLabels[mealType]} 리뷰가 없습니다.</p>
        <p className="text-sm mt-1">첫 번째 리뷰를 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="mb-3">{mealTypeLabels[mealType]} 리뷰 ({mealReviews.length})</h4>
      {mealReviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-muted rounded-full p-2">
                <User className="size-4" />
              </div>
              <span className="text-sm">익명 사용자</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{review.rating}</span>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(review.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </Card>
      ))}
    </div>
  );
}
