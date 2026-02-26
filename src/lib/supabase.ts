// =============================================
// SUPABASE CLIENT
// =============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kaxxjcavvofbrhoesanb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheHhqY2F2dm9mYnJob2VzYW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDUwNzYsImV4cCI6MjA4NzYyMTA3Nn0.wndGpHSKNPOeaqLzuMeLwS3W0zgCXV8026LtkJLzqlE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
