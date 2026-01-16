/**
 * Enumerado de Stored Procedures
 * Mantener sincronizado con la BD
 */
export const StoredProcedures = {
  // Adultos Mayores
  ADULTOS: {
    GET_ALL: 'sp_GetAdultosMayores',
    GET_BY_ID: 'sp_GetAdultoMayorById',
    INSERT: 'sp_InsertAdultoMayor',
    UPDATE: 'sp_UpdateAdultoMayor',
    DELETE: 'sp_DeleteAdultoMayor'
  },
  
  // Medicamentos
  MEDICAMENTOS: {
    GET_ALL: 'sp_GetMedicamentos',
    GET_BY_ADULTO: 'sp_GetMedicamentosByAdulto',
    INSERT: 'sp_InsertMedicamento',
    REGISTRAR_TOMA: 'sp_RegistrarTomaMedicamento'
  },
  
  // Asistencia
  ASISTENCIA: {
    GET_BY_FECHA: 'sp_GetAsistenciaByFecha',
    REGISTRAR: 'sp_RegistrarAsistencia'
  }
} as const;
