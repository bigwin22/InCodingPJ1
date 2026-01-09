import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv
from NEIS.NEISApi import NEISApi

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="School Meal Review Platform API")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://meal.newme.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NEIS API
neis_client = NEISApi()

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Optional[Client] = None
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set. Database features will fail.")
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Error initializing Supabase: {e}")

# Pydantic Models

class ReviewCreate(BaseModel):
    school_code: str
    office_code: str
    meal_date: str # YYYYMMDD
    meal_type: str # '조식', '중식', '석식'
    rating: int = Field(..., ge=1, le=5)
    content: Optional[str] = None

# Endpoints

@app.get("/")
async def root():
    return {"message": "School Meal Review Platform API is running"}

@app.get("/api/schools", tags=["Schools"])
async def search_schools(name: str = Query(..., min_length=2)):
    """Search for schools by name"""
    result = neis_client.search_school(name)
    
    if "schoolInfo" not in result:
        return {"schools": []}
    
    # Extract row data
    try:
        schools_data = result["schoolInfo"][1]["row"]
        return {"schools": schools_data}
    except (KeyError, IndexError):
        return {"schools": []}

@app.get("/api/meals", tags=["Meals"])
async def get_meals(
    school_code: str,
    office_code: str,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get meal information"""
    result = neis_client.get_meals(
        office_code=office_code,
        school_code=school_code,
        date=date,
        start_date=start_date,
        end_date=end_date
    )
    
    if "mealServiceDietInfo" not in result:
        return {"meals": []}
        
    try:
        meals_data = result["mealServiceDietInfo"][1]["row"]
        
        # Process meals to add parsed info
        processed_meals = []
        for meal in meals_data:
            meal["parsed_dishes"] = NEISApi.parse_dishes(meal.get("DDISH_NM", ""))
            meal["parsed_nutrition"] = NEISApi.parse_nutrition(meal.get("NTR_INFO", ""))
            meal["calories"] = NEISApi.parse_calories(meal.get("CAL_INFO", ""))
            processed_meals.append(meal)
            
        return {"meals": processed_meals}
    except (KeyError, IndexError):
        return {"meals": []}

@app.get("/api/reviews", tags=["Reviews"])
async def get_reviews(
    school_code: str,
    office_code: str,
    meal_date: Optional[str] = None,
    meal_type: Optional[str] = None
):
    """Get reviews from Supabase"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
        
    query = supabase.table("reviews").select("*").eq("school_code", school_code).eq("office_code", office_code)
    
    if meal_date:
        query = query.eq("meal_date", meal_date)
    if meal_type:
        query = query.eq("meal_type", meal_type)
        
    # Sort by created_at desc
    query = query.order("created_at", desc=True)
    
    response = query.execute()
    return {"reviews": response.data}

@app.post("/api/reviews", tags=["Reviews"])
async def create_review(review: ReviewCreate):
    """Create a new review"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
    
    data = review.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    
    try:
        response = supabase.table("reviews").insert(data).execute()
        if len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create review")
    except Exception as e:
        print(f"Error creating review: {e}")
        # Return specific error if possible
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats", tags=["Stats"])
async def get_school_stats(school_code: str, office_code: str):
    """Get average ratings for a school"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
        
    response = supabase.table("reviews").select("rating").eq("school_code", school_code).eq("office_code", office_code).execute()
    
    ratings = [item['rating'] for item in response.data]
    if not ratings:
        return {"average_rating": 0, "review_count": 0}
        
    avg_rating = sum(ratings) / len(ratings)
    return {"average_rating": round(avg_rating, 2), "review_count": len(ratings)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)
