import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validar que vengan los datos
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    // Buscar usuario por email
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .limit(1)

    if (error) {
      console.error('Error buscando usuario:', error)
      return NextResponse.json({
        success: false,
        message: 'Error en el sistema. Por favor contacte al administrador.'
      }, { status: 500 })
    }

    // Usuario no existe o está inactivo
    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales incorrectas. Por favor contacte al administrador del sistema.'
      }, { status: 401 })
    }

    const usuario = usuarios[0]

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales incorrectas. Por favor contacte al administrador del sistema.'
      }, { status: 401 })
    }

    // Actualizar último acceso
    await supabase
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', usuario.id)

    // Crear respuesta exitosa con datos del usuario (sin el password_hash)
    const { password_hash, ...usuarioSinPassword } = usuario

    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      usuario: usuarioSinPassword
    })

    // Establecer cookie de sesión (válida por 7 días)
    response.cookies.set('user_session', JSON.stringify({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    })

    return response

  } catch (error: any) {
    console.error('Error en login:', error)
    return NextResponse.json({
      success: false,
      message: 'Error en el sistema. Por favor contacte al administrador.'
    }, { status: 500 })
  }
}