import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MealHome } from "./pages/MealHome";
import { MyPage } from "./pages/MyPage";
import { AlertTriangle } from "lucide-react";

export default function App() {
  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_KEY;

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="size-8 text-red-500" />
            <h1 className="text-xl font-bold text-red-700">설정 오류 발생</h1>
          </div>
          <p className="text-gray-700 mb-4">
            Supabase 환경 변수가 설정되지 않았습니다.
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-600 mb-4">
            School Meal Review Platform/.env
          </div>
          <p className="text-sm text-gray-600">
            위 파일에 <code>VITE_SUPABASE_URL</code>과 <code>VITE_SUPABASE_KEY</code>가 올바르게 입력되었는지 확인하고, 
            <strong>서버를 반드시 재시작</strong>해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MealHome />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  );
}