import { NextResponse } from 'next/server';
import { executeQuery } from '@/BD/Acceso';

export async function GET() {
  try {
    // Query simple de prueba
    const result = await executeQuery('SELECT 1 + 1 AS result');
    
    return NextResponse.json({
      success: true,
      message: '✅ Conexión a Supabase PostgreSQL exitosa!',
      data: result
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '❌ Error de conexión',
      error: error.message
    }, { status: 500 });
  }
}