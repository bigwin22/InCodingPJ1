import { useState, useCallback } from "react";
import { School } from "../types";
import { api } from "../lib/api";
import { getNextWeekday } from "../lib/dateUtils";

export function useSchoolSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const searchSchool = useCallback(async (schoolName: string, onDateChange: (date: Date) => void) => {
    setIsSearching(true);
    try {
      const results = await api.searchSchools(schoolName);
      if (results.length > 0) {
        setSelectedSchool(results[0]);
        // Set date to next weekday (or today if it's a weekday)
        onDateChange(getNextWeekday(new Date()));
      } else {
        setSelectedSchool(null);
        alert("검색 결과가 없습니다.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    isSearching,
    selectedSchool,
    setSelectedSchool,
    searchSchool,
  };
}
