// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("supabaseClient.ts - VITE_SUPABASE_URL:", supabaseUrl);
console.log(
  "supabaseClient.ts - VITE_SUPABASE_ANON_KEY:",
  supabaseAnonKey
    ? "Loaded (length: " + supabaseAnonKey.length + ")"
    : "MISSING or EMPTY"
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "CRITICAL: Supabase URL or Anon Key is missing from .env.local. " +
      "Supabase client cannot be initialized. Ensure .env.local is correct and the dev server was restarted."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
