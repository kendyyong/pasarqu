import { createClient } from '@supabase/supabase-js'

// --- KONFIGURASI LANGSUNG (HARDCODE) ---
// Kita masukkan kunci langsung di sini agar tidak perlu membaca file .env lagi.
// Ini solusi pasti agar error "URL not found" hilang.

const supabaseUrl = 'https://rutyhzpctkfsshckiuqn.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dHloenBjdGtmc3NoY2tpdXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjAxMjYsImV4cCI6MjA4NTkzNjEyNn0.ThFJ1QfYZf3LgoX5ZzxKRIrSSosnPUgjYrkIBkEu7UI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)