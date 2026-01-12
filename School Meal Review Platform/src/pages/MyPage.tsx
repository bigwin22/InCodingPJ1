import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Review } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Trash2, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MyPage() {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchReviews = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await api.getMyReviews(token);
      setReviews(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
        navigate("/");
        return;
    }
    fetchReviews();
  }, [token, navigate]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("정말 이 리뷰를 삭제하시겠습니까?")) return;

    try {
      const success = await api.deleteReview(id, token);
      if (success) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
                <UtensilsCrossed className="size-6 text-primary" />
                <h1 className="text-xl font-bold">마이페이지</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border rounded-lg p-6 mb-6">
             <h2 className="text-lg font-semibold mb-1">{user?.name}님</h2>
             <p className="text-sm text-muted-foreground">{user?.email}</p>
             <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium">소속 학교</p>
                <p className="text-primary">{user?.school_name || "설정된 학교 없음"}</p>
             </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">내가 작성한 리뷰 ({reviews.length})</h3>

          {isLoading ? (
             <div className="text-center py-12">
               <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
               <p className="text-muted-foreground">리뷰를 불러오는 중...</p>
             </div>
          ) : (
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-20 bg-card border rounded-lg border-dashed">
                        <p className="text-muted-foreground">작성한 리뷰가 없습니다.</p>
                        <Button variant="link" onClick={() => navigate("/")}>급식 보러 가기</Button>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-card border rounded-lg p-4 sm:p-5 space-y-3 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-primary">
                                        {review.mealDate.substring(0, 4)}.{review.mealDate.substring(4, 6)}.{review.mealDate.substring(6, 8)}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {review.mealType === 'breakfast' ? '조식' : review.mealType === 'lunch' ? '중식' : '석식'}
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-500 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <span key={i} className={i < review.rating ? "fill-current" : "text-muted"}>★</span>
                                        ))}
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(review.id)}
                                >
                                    <Trash2 className="size-5" />
                                </Button>
                            </div>
                            <p className="text-sm sm:text-base leading-relaxed">{review.content}</p>
                            <div className="text-xs text-muted-foreground text-right border-t pt-2">
                                작성일: {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}