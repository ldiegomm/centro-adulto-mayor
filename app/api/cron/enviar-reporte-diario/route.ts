import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Seguridad: Verificar que la petición viene de Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_URL) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_URL no está configurado' 
      }, { status: 500 });
    }
    
    // 2. Obtener fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    
    // 3. Llamar al endpoint que envía el email
    const baseUrl = process.env.VERCEL_URL;
   console.log('Intentando fetch a:', `${baseUrl}/api/emails/reporte-medicamentos`);

    const response = await fetch(`${baseUrl}/api/emails/reporte-medicamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha: hoy })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const responseText = await response.text();
    console.log('Response text:', responseText.substring(0, 200));

    let result;
    try {
    result = JSON.parse(responseText);
    } catch (e) {
    console.error('Error parsing JSON:', e);
    console.error('Response was:', responseText);
    return NextResponse.json({ 
        error: 'El endpoint devolvió contenido inválido',
        status: response.status,
        content: responseText.substring(0, 500)
    }, { status: 500 });
    }
    
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