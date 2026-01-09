// 날짜를 YYYY-MM-DD 형식으로 변환하는 유틸리티 함수
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatYMD(dateStr: string): string {
    // YYYYMMDD -> YYYY-MM-DD
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

// 주말을 건너뛰고 다음 평일을 찾는 함수
export function getNextWeekday(date: Date): Date {
  const nextDate = new Date(date);
  const dayOfWeek = nextDate.getDay();
  
  // 토요일(6)이면 월요일로 이동
  if (dayOfWeek === 6) {
    nextDate.setDate(nextDate.getDate() + 2);
  }
  // 일요일(0)이면 월요일로 이동
  else if (dayOfWeek === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

// 주말을 건너뛰고 이전 평일을 찾는 함수
export function getPreviousWeekday(date: Date): Date {
  const prevDate = new Date(date);
  const dayOfWeek = prevDate.getDay();
  
  // 월요일(1)이면 금요일로 이동
  if (dayOfWeek === 1) {
    prevDate.setDate(prevDate.getDate() - 3);
  }
  // 일요일(0)이면 금요일로 이동
  else if (dayOfWeek === 0) {
    prevDate.setDate(prevDate.getDate() - 2);
  }
  // 토요일(6)이면 금요일로 이동
  else if (dayOfWeek === 6) {
    prevDate.setDate(prevDate.getDate() - 1);
  }
  
  return prevDate;
}
