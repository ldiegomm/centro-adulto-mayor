import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test simple: hacer un select de la tabla adultos_mayores
    const { data, error } = await supabase
      .from('adultos_mayores')
      .select('id, nombre, apellido1, apellido2')
      .limit(5)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '✅ Conexión a Supabase exitosa usando ANON_KEY',
      registros: data?.length || 0,
      data
    })
  } catch (error: any) {
    console.error('Caught error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}