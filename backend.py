import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body, Depends, Header
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

# --- Pydantic Models ---

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    school_code: Optional[str] = None
    office_code: Optional[str] = None
    school_name: Optional[str] = None

class UserUpdate(BaseModel):
    school_code: str
    office_code: str
    school_name: str

class User(UserBase):
    id: str  # UUID
    created_at: str
    
    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    school_code: str
    office_code: str
    meal_date: str # YYYYMMDD
    meal_type: str # '조식', '중식', '석식'
    rating: int = Field(..., ge=1, le=5)
    content: Optional[str] = None

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    content: Optional[str] = None

# --- Dependencies ---

async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """
    Verifies the Supabase JWT and returns the user from the database.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
    
    token = authorization.split(" ")[1]
    
    if not supabase:
         raise HTTPException(status_code=503, detail="Database service unavailable")

    try:
        # 1. Verify token with Supabase Auth
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user_id = user_response.user.id
        email = user_response.user.email
        
        # 2. Check public.users table
        # We assume the ID in public.users matches the Auth User ID
        response = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if response.data:
            return User(**response.data[0])
        else:
            # First time accessing backend after Supabase Login? 
            # Sync user to public table
            # Try to get name from user_metadata
            name = user_response.user.user_metadata.get("full_name") or user_response.user.user_metadata.get("name") or email.split("@")[0]
            
            new_user = {
                "id": user_id,
                "email": email,
                "name": name,
                "google_id": user_response.user.identities[0].id if user_response.user.identities else "unknown" 
                # Note: google_id might not be strictly needed if we link by ID, but keeping it for reference
            }
            
            # Upsert to be safe
            create_response = supabase.table("users").upsert(new_user).execute()
            if create_response.data:
                return User(**create_response.data[0])
            else:
                 raise HTTPException(status_code=500, detail="Failed to sync user")
            
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "School Meal Review Platform API is running"}

# User Endpoints (Auth is handled by Supabase on Frontend)

@app.get("/api/auth/me", tags=["Auth"], response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user info using Access Token.
    """
    return current_user

@app.put("/api/user/school", tags=["User"])
async def update_user_school(update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update the user's school setting"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
    
    try:
        response = supabase.table("users").update({
            "school_code": update_data.school_code,
            "office_code": update_data.office_code,
            "school_name": update_data.school_name,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", current_user.id).execute()
        
        if response.data:
            return response.data[0]
        else:
             raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        print(f"Error updating user school: {e}")
        raise HTTPException(status_code=500, detail="Failed to update school")

@app.get("/api/user/reviews", tags=["User"])
async def get_my_reviews(current_user: User = Depends(get_current_user)):
    """Get all reviews by the current user"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
        
    response = supabase.table("reviews").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
    return {"reviews": response.data}


# School / Meal Endpoints

@app.get("/api/schools", tags=["Schools"])
async def search_schools(name: str = Query(..., min_length=2)):
    """Search for schools by name"""
    result = neis_client.search_school(name)
    
    if "schoolInfo" not in result:
        return {"schools": []}
    
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
    """Get reviews (Public)"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
        
    query = supabase.table("reviews").select("*").eq("school_code", school_code).eq("office_code", office_code)
    
    if meal_date:
        query = query.eq("meal_date", meal_date)
    if meal_type:
        query = query.eq("meal_type", meal_type)
        
    query = query.order("created_at", desc=True)
    
    response = query.execute()
    return {"reviews": response.data}

@app.post("/api/reviews", tags=["Reviews"])
async def create_review(review: ReviewCreate, current_user: User = Depends(get_current_user)):
    """
    Create a new review. 
    Requires Auth. 
    Restricted to user's set school.
    One review per meal per user.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
        
    # 1. Check if user has set a school
    if not current_user.school_code or not current_user.office_code:
         raise HTTPException(status_code=400, detail="You must set your school before reviewing.")
    
    # 2. Check if review is for the user's school
    if review.school_code != current_user.school_code or review.office_code != current_user.office_code:
        raise HTTPException(status_code=403, detail="You can only review meals for your own school.")

    # 3. Check for existing review (One review per meal type)
    existing = supabase.table("reviews").select("id").eq("user_id", current_user.id).eq("meal_date", review.meal_date).eq("meal_type", review.meal_type).execute()
    
    if existing.data:
         review_id = existing.data[0]['id']
         update_response = supabase.table("reviews").update({
             "rating": review.rating,
             "content": review.content,
             "updated_at": datetime.utcnow().isoformat()
         }).eq("id", review_id).execute()
         return update_response.data[0]

    # Create new
    data = review.dict()
    data["user_id"] = current_user.id
    data["created_at"] = datetime.utcnow().isoformat()
    
    try:
        response = supabase.table("reviews").insert(data).execute()
        if len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create review")
    except Exception as e:
        print(f"Error creating review: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reviews/{review_id}", tags=["Reviews"])
async def delete_review(review_id: str, current_user: User = Depends(get_current_user)):
    """Delete a review (Owner only)"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    existing = supabase.table("reviews").select("user_id").eq("id", review_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if existing.data[0]['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    supabase.table("reviews").delete().eq("id", review_id).execute()
    return {"message": "Review deleted successfully"}

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