import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    if (!process.env.EMAIL_NOTIFICACIONES) {
      return NextResponse.json({ 
        error: 'EMAIL_NOTIFICACIONES no está configurado' 
      }, { status: 500 });
    }
    
    const { fecha } = await request.json();
    
    // Obtener día de la semana (0 = domingo, 6 = sábado)
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();
    
    // Mapear día de semana a columnas booleanas de la tabla
    const columnaDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][diaSemana];
   // 1. Query usando Supabase Client 
  const { data: medicamentos, error } = await supabase
  .from('toma_medicamentos')
  .select(`
    nombre_medicamento,
    dosis,
    via_administracion,
    horario_manana,
    horario_mediodia,
    horario_tarde,
    horario_noche,
    indicaciones,
    adultos_mayores (
      id,
      nombre,
      apellido1,
      apellido2,
      cedula
    )
  `)
  .eq('estado', 'Activo')
  .eq('adultos_mayores.estado', 'Activo')
  .eq(columnaDia, true);

if (error) {
  console.error('Error Supabase:', error);
  return NextResponse.json({ 
    error: error.message 
  }, { status: 500 });
}

if (!medicamentos || medicamentos.length === 0) {
  return NextResponse.json({ 
    success: true, 
    message: 'No hay medicamentos programados para este día' 
  });
}

// Ordenar manualmente en JavaScript después de obtener los datos
const medicamentosOrdenados = medicamentos.sort((a: any, b: any) => {
  const adultoA = a.adultos_mayores;
  const adultoB = b.adultos_mayores;
  
  // Ordenar por nombre
  if (adultoA.nombre !== adultoB.nombre) {
    return adultoA.nombre.localeCompare(adultoB.nombre);
  }
  
  // Si el nombre es igual, ordenar por apellido1
  if (adultoA.apellido1 !== adultoB.apellido1) {
    return adultoA.apellido1.localeCompare(adultoB.apellido1);
  }
  
  // Si nombre y apellido1 son iguales, ordenar por medicamento
  return a.nombre_medicamento.localeCompare(b.nombre_medicamento);
});

// 2. Agrupar medicamentos por adulto mayor
const adultosMedicamentos: any = {};
medicamentosOrdenados.forEach((med: any) => {
  const adulto = med.adultos_mayores;
  const key = adulto.id;
  
      
      if (!adultosMedicamentos[key]) {
        adultosMedicamentos[key] = {
          nombre: `${adulto.nombre} ${adulto.apellido1} ${adulto.apellido2 || ''}`.trim(),
          cedula: adulto.cedula,
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
    const { data, error: emailError } = await resend.emails.send({
      from: 'Centro Adulto Mayor <onboarding@resend.dev>',
      to: [process.env.EMAIL_NOTIFICACIONES],
      subject: `Reporte de Medicamentos - ${fecha}`,
      html: emailHTML
    });
    
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
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