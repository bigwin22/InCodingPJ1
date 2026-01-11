# React Hooks Refactoring Report

This document details the refactoring of the School Meal Review Platform frontend to utilize React Hooks effectively, specifically focusing on Custom Hooks, `useMemo`, and `useCallback`.

## 1. Custom Hooks

We extracted complex logic from `App.tsx` into three dedicated custom hooks located in `src/hooks/`.

### `useSchoolSearch`
- **Path**: `src/hooks/useSchoolSearch.ts`
- **Purpose**: Manages the state and logic for searching schools.
- **Key Features**:
  - Handles the `isSearching` loading state.
  - Manages the `selectedSchool` state.
  - Provides a `searchSchool` function that calls the API and updates state.
- **Benefit**: Decouples the search logic from the UI. If we need to implement search in another component or change how search works (e.g., add debounce), we can do it in one place without touching the UI code.

### `useSchoolData`
- **Path**: `src/hooks/useSchoolData.ts`
- **Purpose**: Manages the fetching and state of school-related data (meals, reviews, stats).
- **Key Features**:
  - Automatically fetches data when `selectedSchool` or `currentDate` changes using `useEffect`.
  - Manages loading states (`isLoadingData`).
  - Provides a `refreshReviews` function to re-fetch data after a review is submitted.
- **Benefit**: Centralizes data fetching logic. The component no longer needs to know *how* data is fetched or from which endpoints. It ensures that data synchronization logic (fetching meals, reviews, and stats together) is consistent.

### `useReviewSystem`
- **Path**: `src/hooks/useReviewSystem.ts`
- **Purpose**: Manages the UI and logic for submitting reviews.
- **Key Features**:
  - Controls the visibility of the review dialog (`reviewDialogOpen`).
  - Tracks which meal type is being reviewed.
  - Handles the API call to submit a review and triggers the success/failure alerts.
- **Benefit**: Removes UI state management (dialog open/close) from the main `App` component, making the main component cleaner and focused on layout.

## 2. Performance Optimization Hooks

We applied `useMemo` and `useCallback` in `App.tsx` to optimize rendering performance.

### `useCallback`
- **Usage**: Applied to event handlers like `handleSearch`, `searchSchool` (inside hook), `fetchData` (inside hook), and `submitReview` (inside hook).
- **Example**:
  ```typescript
  const handleSearch = useCallback((schoolName: string) => {
    searchSchool(schoolName, setCurrentDate);
  }, [searchSchool]);
  ```
- **Benefit**: Ensures that these functions preserve their reference identity between renders. This prevents child components (like `SearchBar` or `ReviewDialog`) from re-rendering unnecessarily simply because a parent function was recreated.

### `useMemo`
- **Usage**: Applied to expensive calculations or derived state.
- **Example 1: Meal Statistics**
  ```typescript
  const getMealStats = useCallback((mealType: "breakfast" | "lunch" | "dinner") => { ... }, [reviews]);
  ```
  *(Note: While `getMealStats` is a function, wrapping it in `useCallback` allows it to be used efficiently. In this specific refactor, we used `useCallback` because it's called during render map. A true `useMemo` example is below.)*
  
- **Example 2: School Info Props**
  ```typescript
  const schoolInfoProps = useMemo(() => {
    if (!selectedSchool) return null;
    return { ...selectedSchool, averageRating };
  }, [selectedSchool, averageRating]);
  ```
- **Benefit**: The `schoolInfoProps` object is only recreated when `selectedSchool` or `averageRating` changes. This allows the `SchoolInfo` component (if optimized with `React.memo`) to skip re-rendering if other unrelated state (like `reviewDialogOpen`) changes.

## Summary of Improvements

1.  **Code Readability**: `App.tsx` was significantly reduced in size and complexity. It now reads like a high-level description of the UI, rather than a mix of UI and low-level logic.
2.  **Separation of Concerns**: Logic is organized by feature (Search, Data, Reviews) rather than being jumbled together in one big component.
3.  **Maintainability**: Modifying the review submission logic or data fetching strategy now happens in isolated files, reducing the risk of introducing bugs in unrelated parts of the application.
4.  **Performance**: `useMemo` and `useCallback` prevent wasted render cycles, which is especially important as the application grows or if we add more complex interactive elements.
