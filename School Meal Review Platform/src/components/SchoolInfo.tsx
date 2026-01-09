import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { School as SchoolIcon, MapPin, Star } from "lucide-react";
import { School } from "../types";

interface SchoolInfoProps {
  school: School;
}

export function SchoolInfo({ school }: SchoolInfoProps) {
  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
        <div className="flex items-start gap-3 sm:gap-4 w-full">
          <div className="bg-primary text-primary-foreground rounded-lg p-2 sm:p-3 shrink-0">
            <SchoolIcon className="size-5 sm:size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="mb-2 text-lg sm:text-xl truncate">{school.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MapPin className="size-4 shrink-0" />
              <span className="text-xs sm:text-sm truncate">{school.address}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Star className="size-4 sm:size-5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-sm sm:text-base">
                평균 평점: <strong>{(school.averageRating || 0).toFixed(1)}</strong> / 5.0
              </span>
              <Badge variant="secondary" className="ml-0 sm:ml-2 text-xs">
                전체 평균
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}