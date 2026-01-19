import { createClient } from '@supabase/supabase-js'

// Crear cliente solo si las variables están disponibles
// Durante build time esto será null, pero en runtime funcionará
export const supabase = 
  typeof window !== 'undefined' || process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )
    : null as any