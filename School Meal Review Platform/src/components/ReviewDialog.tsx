import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Star } from "lucide-react";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => void;
  mealType: "breakfast" | "lunch" | "dinner" | null;
}

export function ReviewDialog({ open, onOpenChange, onSubmit, mealType }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setRating(0);
      setHoveredRating(0);
      setComment("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
    }
  };

  const mealTypeLabels = {
    breakfast: "조식",
    lunch: "중식",
    dinner: "석식",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mealType ? `${mealTypeLabels[mealType]} 리뷰 작성` : "리뷰 작성"}
          </DialogTitle>
          <DialogDescription>
            오늘 급식은 어떠셨나요? 별점과 의견을 남겨주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 별점 선택 */}
          <div className="space-y-2">
            <label className="text-sm">별점</label>
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`size-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating}점 선택됨
              </p>
            )}
          </div>

          {/* 코멘트 입력 */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm">
              의견 (선택사항)
            </label>
            <Textarea
              id="comment"
              placeholder="급식에 대한 의견을 자유롭게 남겨주세요..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            리뷰 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
