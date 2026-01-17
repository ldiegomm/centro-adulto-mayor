import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { executeQuery } from '@/BD/Acceso';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    if (!process.env.EMAIL_NOTIFICACIONES) {
      return NextResponse.json({ 
        error: 'EMAIL_NOTIFICACIONES no está configurado' 
      }, { status: 500 });
    }
    
    const { fecha } = await request.json();
    
    // 1. Query: Obtener medicamentos del día según frecuencia semanal
    const medicamentos = await executeQuery(`
      SELECT 
        am.id,
        am.nombre,
        am.apellido1,
        am.apellido2,
        am.cedula,
        tm.nombre_medicamento,
        tm.dosis,
        tm.via_administracion,
        tm.horario_manana,
        tm.horario_mediodia,
        tm.horario_tarde,
        tm.horario_noche,
        tm.indicaciones
      FROM toma_medicamentos tm
      JOIN adultos_mayores am ON tm.adulto_mayor_id = am.id
      WHERE tm.estado = 'Activo'
        AND am.estado = 'Activo'
        AND (
          (EXTRACT(DOW FROM $1::date) = 0 AND tm.domingo) OR
          (EXTRACT(DOW FROM $1::date) = 1 AND tm.lunes) OR
          (EXTRACT(DOW FROM $1::date) = 2 AND tm.martes) OR
          (EXTRACT(DOW FROM $1::date) = 3 AND tm.miercoles) OR
          (EXTRACT(DOW FROM $1::date) = 4 AND tm.jueves) OR
          (EXTRACT(DOW FROM $1::date) = 5 AND tm.viernes) OR
          (EXTRACT(DOW FROM $1::date) = 6 AND tm.sabado)
        )
      ORDER BY am.nombre, am.apellido1, tm.nombre_medicamento
    `, [fecha]);
    
    if (medicamentos.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No hay medicamentos programados para este día' 
      });
    }
    
    // 2. Agrupar medicamentos por adulto mayor
    const adultosMedicamentos: any = {};
    medicamentos.forEach((med: any) => {
      const key = med.id;
      if (!adultosMedicamentos[key]) {
        adultosMedicamentos[key] = {
          nombre: `${med.nombre} ${med.apellido1} ${med.apellido2 || ''}`.trim(),
          cedula: med.cedula,
          medicamentos: []
        };
      }
      
      const horarios = [];
      if (med.horario_manana) horarios.push(`Mañana: ${med.horario_manana}`);
      if (med.horario_mediodia) horarios.push(`Mediodía: ${med.horario_mediodia}`);
      if (med.horario_tarde) horarios.push(`Tarde: ${med.horario_tarde}`);
      if (med.horario_noche) horarios.push(`Noche: ${med.horario_noche}`);
      
      adultosMedicamentos[key].medicamentos.push({
        nombre: med.nombre_medicamento,
        dosis: med.dosis,
        via: med.via_administracion,
        horarios: horarios.join(', '),
        indicaciones: med.indicaciones
      });
    });
    
    // 3. Generar HTML del email
    let emailHTML = `
      <h1 style="color: #2563eb;">📋 Reporte de Medicamentos</h1>
      <h2>${fecha}</h2>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
    `;
    
    Object.values(adultosMedicamentos).forEach((adulto: any) => {
      emailHTML += `
        <div style="margin-bottom: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">${adulto.nombre}</h3>
          <p style="color: #6b7280; margin: 5px 0;">Cédula: ${adulto.cedula}</p>
          <ul style="list-style: none; padding: 0;">
      `;
      
      adulto.medicamentos.forEach((med: any) => {
        emailHTML += `
          <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px;">
            <strong style="color: #2563eb;">💊 ${med.nombre}</strong> - ${med.dosis}<br>
            <span style="color: #6b7280;">Vía: ${med.via}</span><br>
            <span style="color: #059669;">⏰ ${med.horarios}</span><br>
            ${med.indicaciones ? `<em style="color: #9ca3af;">📝 ${med.indicaciones}</em>` : ''}
          </li>
        `;
      });
      
      emailHTML += `
          </ul>
        </div>
      `;
    });
    
    const totalAdultos = Object.keys(adultosMedicamentos).length;
    emailHTML += `
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280;"><strong>Total:</strong> ${totalAdultos} adultos mayores con medicamentos programados</p>
    `;
    
    // 4. Enviar email
    
    const { data, error } = await resend.emails.send({
    from: 'Centro Adulto Mayor <onboarding@resend.dev>',
    to: [process.env.EMAIL_NOTIFICACIONES],
    subject: `Reporte de Medicamentos - ${fecha}`,
    html: emailHTML
    });
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      adultos: totalAdultos,
      medicamentos: medicamentos.length
    });
    
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}