import { Pool } from 'pg';

// Pool de conexiones a PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Ejecuta una query directa
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T> {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows as T;
  } finally {
    client.release();
  }
}

/**
 * Ejecuta una función (equivalente a SP en PostgreSQL)
 */
export async function executeFunction<T = any>(
  functionName: string,
  params: any[] = []
): Promise<T> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(',');
  const query = `SELECT * FROM ${functionName}(${placeholders})`;
  return executeQuery<T>(query, params);
}

export default pool;