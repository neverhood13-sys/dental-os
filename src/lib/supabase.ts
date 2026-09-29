import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    'Supabase: не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Проверьте .env.local или переменные окружения хостинга.'
  );
}

export const supabase = createClient(url, key);