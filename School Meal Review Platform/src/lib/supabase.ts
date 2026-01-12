import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// 환경 변수가 없으면 콘솔에 에러를 남기고, 빈 클라이언트를 만드는 대신 null을 처리할 수 있게 하거나
// 유효하지 않은 URL이라도 넣어 앱이 죽는 것은 방지합니다.
const isValidConfig = supabaseUrl && supabaseKey;

if (!isValidConfig) {
  console.error("Critical: VITE_SUPABASE_URL or VITE_SUPABASE_KEY is missing.");
}

// createClient에 빈 문자열이 들어가면 오류가 발생하므로, 
// 개발 중 환경변수가 없을 때를 대비해 더미 값을 넣거나 예외 처리를 해야 합니다.
// 여기서는 환경변수가 없으면 undefined를 반환하지 않고, 
// AuthContext에서 이를 감지할 수 있도록 합니다.

export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        // OAuth 리다이렉트 후 URL의 auth fragment 자동 감지 (가장 중요!)
        detectSessionInUrl: true,

        // localStorage에 세션 자동 저장
        persistSession: true,

        // localStorage를 세션 저장소로 사용
        storage: window.localStorage,

        // Access Token 만료 전 자동 갱신
        autoRefreshToken: true,

        // PKCE 플로우 사용 (보안 강화)
        flowType: 'pkce',

        // 개발 환경에서 디버깅 활성화
        debug: import.meta.env.DEV,
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });