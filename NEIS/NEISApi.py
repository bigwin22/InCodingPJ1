import requests
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

class NEISApi:
    """
    NEIS Open API Client for School Information and Meal Menus.
    """
    BASE_URL = "https://open.neis.go.kr/hub"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the NEIS API client.
        :param api_key: NEIS Open API Key. Defaults to environment variable NEIS_API_KEY or 'sample'.
        """
        self.api_key = api_key or os.getenv("NEIS_API_KEY", "sample")
        print(f"API Key: {self.api_key}")
        self.type = "json"

    def _get(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal method to make GET requests to NEIS API.
        """
        url = f"{self.BASE_URL}/{endpoint}"
        default_params = {
            "Type": self.type,
            "pIndex": 1,
            "pSize": 100
        }
        if self.api_key and self.api_key != "sample":
            default_params["KEY"] = self.api_key
            
        # Merge default params with provided params, ensuring provided ones take precedence
        merged_params = {**default_params, **params}
        
        try:
            response = requests.get(url, params=merged_params)
            response.raise_for_status()
            data = response.json()
            
            # Check for API-level errors (e.g., INFO-200 means no data, but others might be errors)
            if endpoint in data:
                return data
            elif "RESULT" in data:
                # If there's a RESULT but the main endpoint key is missing, it's usually an error or info message
                return data
            
            return data
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to NEIS API: {e}")
            return {"error": str(e)}

    def search_school(self, school_name: str) -> Dict[str, Any]:
        """
        Search for school basic information by school name.
        """
        params = {
            "SCHUL_NM": school_name
        }
        return self._get("schoolInfo", params)

    @staticmethod
    def parse_dishes(dish_nm: str) -> list[str]:
        """
        Parses the DDISH_NM string into a list of dish names, removing allergy information.
        Example: "백미밥 <br/>쇠고기배추된장국 (5.6.16)" -> ["백미밥", "쇠고기배추된장국"]
        """
        import re
        if not dish_nm:
            return []
        # Split by <br/>
        dishes = dish_nm.split("<br/>")
        # Remove allergy info like (1.2.5.6) and strip whitespace
        cleaned_dishes = [re.sub(r"\s*\([\d\.]+\)", "", dish).strip() for dish in dishes]
        return [dish for dish in cleaned_dishes if dish]

    @staticmethod
    def parse_nutrition(ntr_info: str) -> Dict[str, str]:
        """
        Parses the NTR_INFO string into a dictionary.
        Example: "탄수화물(g) : 123.3<br/>단백질(g) : 31.2" -> {"탄수화물(g)": "123.3", "단백질(g)": "31.2"}
        """
        if not ntr_info:
            return {}
        # Split by <br/>
        items = ntr_info.split("<br/>")
        nutrition_dict = {}
        for item in items:
            if ":" in item:
                key, value = item.split(":", 1)
                nutrition_dict[key.strip()] = value.strip()
        return nutrition_dict

    def get_meals(self, 
                  office_code: str, 
                  school_code: str, 
                  date: Optional[str] = None, 
                  start_date: Optional[str] = None, 
                  end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch meal menus for a specific school.
        :param office_code: ATPT_OFCDC_SC_CODE (e.g., 'J10')
        :param school_code: SD_SCHUL_CODE (e.g., '7530126')
        :param date: MLSV_YMD (YYYYMMDD)
        :param start_date: MLSV_FROM_YMD (YYYYMMDD)
        :param end_date: MLSV_TO_YMD (YYYYMMDD)
        """
        params = {
            "ATPT_OFCDC_SC_CODE": office_code,
            "SD_SCHUL_CODE": school_code
        }
        if date:
            params["MLSV_YMD"] = date
        if start_date:
            params["MLSV_FROM_YMD"] = start_date
        if end_date:
            params["MLSV_TO_YMD"] = end_date
            
        return self._get("mealServiceDietInfo", params)

if __name__ == "__main__":
    # Example usage for testing
    api = NEISApi()
    
    print("Testing School Search...")
    school_results = api.search_school("민족사관고등학교")
    print(school_results)
    
    # If a school was found, try fetching meals
    if "schoolInfo" in school_results:
        school_info = school_results["schoolInfo"][1]["row"][0]
        office_code = school_info["ATPT_OFCDC_SC_CODE"]
        school_code = school_info["SD_SCHUL_CODE"]
        
        print(f"\nTesting Meal Fetching for {school_info['SCHUL_NM']}...")
        # Today's date is 2026-01-09 according to prompt context
        meal_results = api.get_meals(office_code, school_code, date="20260109")
        
        if "mealServiceDietInfo" in meal_results:
            meals = meal_results["mealServiceDietInfo"][1]["row"]
            for meal in meals:
                print(f"\n--- {meal['MMEAL_SC_NM']} ---")
                dishes = api.parse_dishes(meal["DDISH_NM"])
                nutrition = api.parse_nutrition(meal["NTR_INFO"])
                print(f"Dishes: {dishes}")
                print(f"Nutrition: {nutrition}")
        else:
            print("No meal info found or error occurred.")
            print(meal_results)
