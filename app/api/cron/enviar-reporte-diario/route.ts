import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Seguridad: Verificar que la petición viene de Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Obtener fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    
    // 3. Llamar al endpoint que envía el email
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/emails/reporte-medicamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: hoy })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: result
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      fecha: hoy,
      result
    });
    
  } catch (error: any) {
    console.error('Error en cron job:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}