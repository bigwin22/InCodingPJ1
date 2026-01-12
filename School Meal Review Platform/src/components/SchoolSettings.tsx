import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { School } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface SchoolSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchoolSelected?: (school: School) => void; // Callback when school is selected
  mustSelect?: boolean; // If true, user cannot close without selecting (for first time setup)
}

export function SchoolSettings({ open, onOpenChange, onSchoolSelected, mustSelect = false }: SchoolSettingsProps) {
  const { token, updateUser, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const schools = await api.searchSchools(searchTerm);
      setResults(schools);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (school: School) => {
    if (!token) return;

    try {
        const updatedUser = await api.updateUserSchool(token, school.schoolCode, school.officeCode, school.name);
        if (updatedUser) {
            updateUser(updatedUser);
            // 선택된 학교를 부모 컴포넌트에 전달
            if (onSchoolSelected) {
                onSchoolSelected(school);
            }
            // 학교 선택이 성공하면 무조건 모달 닫기
            onOpenChange(false);
        }
    } catch (error) {
        console.error("Failed to update school", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (mustSelect && !user?.school_code) return; // Prevent closing if must select and not set
        onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mustSelect ? "학교 설정이 필요합니다" : "나의 학교 설정"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
             <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="학교명을 입력하세요"
                className="pl-9"
             />
          </div>
          <Button type="submit" disabled={isLoading}>검색</Button>
        </form>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {results.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-muted-foreground">{school.address}</div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleSelect(school)}>
                        선택
                    </Button>
                </div>
            ))}
            {results.length === 0 && !isLoading && searchTerm && (
                <div className="text-center text-muted-foreground py-4">
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
