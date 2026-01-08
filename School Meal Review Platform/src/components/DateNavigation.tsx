import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "./ui/button";

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  const handlePreviousDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    // 주말 건너뛰기
    const dayOfWeek = prevDate.getDay();
    if (dayOfWeek === 0) { // 일요일
      prevDate.setDate(prevDate.getDate() - 2);
    } else if (dayOfWeek === 6) { // 토요일
      prevDate.setDate(prevDate.getDate() - 1);
    }
    
    onDateChange(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 주말 건너뛰기
    const dayOfWeek = nextDate.getDay();
    if (dayOfWeek === 0) { // 일요일
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // 토요일
      nextDate.setDate(nextDate.getDate() + 2);
    }
    
    onDateChange(nextDate);
  };

  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 sm:px-4 py-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePreviousDay}
        className="hover:bg-background h-auto py-2 px-2 sm:px-4"
      >
        <ChevronLeft className="size-4 sm:size-5" />
        <span className="ml-1 text-xs sm:text-sm">이전</span>
      </Button>
      
      <div className="flex items-center gap-2">
        <Calendar className="size-4 sm:size-5 text-muted-foreground shrink-0" />
        <span className="font-medium text-xs sm:text-sm text-center">{formatDateString(currentDate)}</span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextDay}
        className="hover:bg-background h-auto py-2 px-2 sm:px-4"
      >
        <span className="mr-1 text-xs sm:text-sm">다음</span>
        <ChevronRight className="size-4 sm:size-5" />
      </Button>
    </div>
  );
}