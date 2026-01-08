import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Meal } from "../types";
import { Sunrise, Sun, Moon, Star } from "lucide-react";

interface MealCardProps {
  meal: Meal;
  averageRating?: number;
  reviewCount?: number;
  onReviewClick?: () => void;
}

export function MealCard({ meal, averageRating = 0, reviewCount = 0, onReviewClick }: MealCardProps) {
  const mealTypeInfo = {
    breakfast: { label: "조식", icon: Sunrise, color: "bg-orange-100 text-orange-700" },
    lunch: { label: "중식", icon: Sun, color: "bg-amber-100 text-amber-700" },
    dinner: { label: "석식", icon: Moon, color: "bg-indigo-100 text-indigo-700" },
  };

  const info = mealTypeInfo[meal.type];
  const Icon = info.icon;

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 sm:size-5" />
          <h3 className="text-base sm:text-lg">{info.label}</h3>
        </div>
        {meal.calories && (
          <Badge variant="secondary" className="text-xs">
            {meal.calories}
          </Badge>
        )}
      </div>

      <div className="space-y-2 mb-3 sm:mb-4">
        {meal.menu.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <span className="size-1.5 rounded-full bg-primary/40 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
        <div className="flex items-center gap-2">
          {averageRating > 0 ? (
            <>
              <Star className="size-3 sm:size-4 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm">
                {averageRating.toFixed(1)} <span className="text-muted-foreground">({reviewCount}개)</span>
              </span>
            </>
          ) : (
            <span className="text-xs sm:text-sm text-muted-foreground">리뷰 없음</span>
          )}
        </div>
        {onReviewClick && (
          <button
            onClick={onReviewClick}
            className="text-xs sm:text-sm text-primary hover:underline whitespace-nowrap"
          >
            리뷰 작성
          </button>
        )}
      </div>
    </Card>
  );
}