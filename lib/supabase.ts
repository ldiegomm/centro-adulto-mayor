import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_DATABASE_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_DATABASE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}

// Export como Proxy para que funcione con la sintaxis actual
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabase()
    const value = client[prop as keyof SupabaseClient]
    
    // Si es una función, bindearla al cliente
    if (typeof value === 'function') {
      return value.bind(client)
    }
    
    return value
  }
})