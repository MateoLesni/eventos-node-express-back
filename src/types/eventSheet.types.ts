export interface EventSheet {
  id: string
  fechaCliente: string
  horaCliente: string
  nombre: string
  telefono: string
  mail: string
  lugar: string
  cantidadPersonas: string
  observacion: string
  redireccion: string
  canal: string
  respuestaViaMail: string
  asignacionComercialMail: string
  horarioInicioEvento: string
  horarioFinalizacionEvento: string
  fechaEvento: string
  sector: string
  vendedorComercialAsignado: string
  marcaTemporal: string
  demora: string
  presupuesto: string
  fechaPresupEnviado: string
  estado: string
  ComercialFinal: string
}

export interface CreateEventSheetDTO {
  fechaCliente: string
  horaCliente: string
  nombre: string
  telefono: string
  mail: string
  lugar: string
  cantidadPersonas: string
  observacion?: string
  redireccion?: string
  canal?: string
  respuestaViaMail?: string
  asignacionComercialMail?: string
  horarioInicioEvento?: string
  horarioFinalizacionEvento?: string
  fechaEvento?: string
  sector?: string
  vendedorComercialAsignado?: string
  marcaTemporal?: string
  demora?: string
  presupuesto?: string
  fechaPresupEnviado?: string
  estado?: string
}

export interface UpdateEventSheetDTO extends Partial<CreateEventSheetDTO> {}
