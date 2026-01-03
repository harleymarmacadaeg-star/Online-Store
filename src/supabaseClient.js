//import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values from the Supabase API page
//const supabaseUrl = 'https://zliubprqbpicouxjjkmv.supabase.co' 
//const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaXVicHJxYnBpY291eGpqa212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDQ4OTYsImV4cCI6MjA4MjMyMDg5Nn0.V-tuvz3jmkDA07lXJWyfmugr_01kAoORVXnEGQTjk5g' 

//export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

// This version is safe for GitHub and Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)