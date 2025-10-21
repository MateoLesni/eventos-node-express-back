import type { EventSheet, CreateEventSheetDTO, UpdateEventSheetDTO } from "../types/eventSheet.types"
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME } from "../config/googleSheets.config"

// 👇 Al inicio del archivo (debajo de imports), útil para encontrar columnas de Observacion
const OBS_COLUMNS = [
  { key: 'Observacion1', index: 23, letter: 'X'  }, // 0-based: A=0 … W=22 ⇒ X=23
  { key: 'Observacion2', index: 24, letter: 'Y'  },
  { key: 'Observacion3', index: 25, letter: 'Z'  },
  { key: 'Observacion4', index: 26, letter: 'AA' },
  { key: 'Observacion5', index: 27, letter: 'AB' },
  { key: 'Observacion6', index: 28, letter: 'AC' },
  { key: 'Observacion7', index: 29, letter: 'AD' },
  { key: 'Observacion8', index: 30, letter: 'AE' },
]




export class EventSheetService {
  private sheets = getGoogleSheetsClient()

  // Convertir fila de Google Sheets a objeto EventSheet
  private rowToEventSheet(row: any[], rowIndex: number): EventSheet {
    return {
      id: String(row[0] || ""), // ✅ Ahora el ID se toma desde la columna A (Id)
      fechaCliente: row[1] || "",
      horaCliente: row[2] || "",
      nombre: row[3] || "",
      telefono: row[4] || "",
      mail: row[5] || "",
      lugar: row[6] || "",
      cantidadPersonas: row[7] || "",
      observacion: row[8] || "",
      redireccion: row[9] || "",
      canal: row[10] || "",
      respuestaViaMail: row[11] || "",
      asignacionComercialMail: row[12] || "",
      horarioInicioEvento: row[13] || "",
      horarioFinalizacionEvento: row[14] || "",
      fechaEvento: row[15] || "",
      sector: row[16] || "",
      vendedorComercialAsignado: row[17] || "",
      marcaTemporal: row[18] || "",
      demora: row[19] || "",
      presupuesto: row[20] || "",
      fechaPresupEnviado: row[21] || "",
      estado: row[22] || "",
    }
  }

  // Convertir objeto EventSheet a fila de Google Sheets
  private eventSheetToRow(event: CreateEventSheetDTO | UpdateEventSheetDTO, id?: string): any[] {
    return [
      id || "", // Id (columna A)
      event.fechaCliente || "",
      event.horaCliente || "",
      event.nombre || "",
      event.telefono || "",
      event.mail || "",
      event.lugar || "",
      event.cantidadPersonas || "",
      event.observacion || "",
      event.redireccion || "",
      event.canal || "",
      event.respuestaViaMail || "",
      event.asignacionComercialMail || "",
      event.horarioInicioEvento || "",
      event.horarioFinalizacionEvento || "",
      event.fechaEvento || "",
      event.sector || "",
      event.vendedorComercialAsignado || "",
      event.marcaTemporal || "",
      event.demora || "",
      event.presupuesto || "",
      event.fechaPresupEnviado || "",
      event.estado || "",
    ]
  }

  async getAllEvents(): Promise<EventSheet[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:AE`, // Desde la fila 2 (asumiendo que la 1 es el header)
      })

      const rows = response.data.values || []
      return rows.map((row, index) => this.rowToEventSheet(row, index))
    } catch (error) {
      console.error("[v0] Error getting all events:", error)
      throw new Error("Error al obtener eventos de Google Sheets")
    }
  }

  async getEventById(id: string): Promise<EventSheet | null> {
    try {
      const rowNumber = Number.parseInt(id) + 1 // +1 porque la fila 1 es el header
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
      })

      const rows = response.data.values || []
      if (rows.length === 0) return null

      return this.rowToEventSheet(rows[0], Number.parseInt(id) - 1)
    } catch (error) {
      console.error("[v0] Error getting event by id:", error)
      throw new Error("Error al obtener evento por ID")
    }
  }

  async createEvent(eventData: CreateEventSheetDTO): Promise<EventSheet> {
    try {
      // Primero obtenemos todas las filas para calcular el nuevo ID
      const allEvents = await this.getAllEvents()
      const newId = String(allEvents.length + 1)

      const newRow = this.eventSheetToRow(eventData, newId)

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:AE`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [newRow],
        },
      })

      return {
        id: newId,
        fechaCliente: eventData.fechaCliente,
        horaCliente: eventData.horaCliente,
        nombre: eventData.nombre,
        telefono: eventData.telefono,
        mail: eventData.mail,
        lugar: eventData.lugar,
        cantidadPersonas: eventData.cantidadPersonas,
        observacion: eventData.observacion || "",
        redireccion: eventData.redireccion || "",
        canal: eventData.canal || "",
        respuestaViaMail: eventData.respuestaViaMail || "",
        asignacionComercialMail: eventData.asignacionComercialMail || "",
        horarioInicioEvento: eventData.horarioInicioEvento || "",
        horarioFinalizacionEvento: eventData.horarioFinalizacionEvento || "",
        fechaEvento: eventData.fechaEvento || "",
        sector: eventData.sector || "",
        vendedorComercialAsignado: eventData.vendedorComercialAsignado || "",
        marcaTemporal: eventData.marcaTemporal || "",
        demora: eventData.demora || "",
        presupuesto: eventData.presupuesto || "",
        fechaPresupEnviado: eventData.fechaPresupEnviado || "",
        estado: eventData.estado || "",
      }
    } catch (error) {
      console.error("[v0] Error creating event:", error)
      throw new Error("Error al crear evento en Google Sheets")
    }
  }

  async updateEvent(id: string, eventData: UpdateEventSheetDTO): Promise<EventSheet | null> {
    try {
      // Primero obtenemos el evento actual
      const currentEvent = await this.getEventById(id)
      if (!currentEvent) return null

      // Mezclamos los datos actuales con los nuevos
      const updatedEvent = { ...currentEvent, ...eventData }
      const rowNumber = Number.parseInt(id) + 1 // +1 porque la fila 1 es el header

      const updatedRow = this.eventSheetToRow(updatedEvent, id)

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [updatedRow],
        },
      })

      return updatedEvent
    } catch (error) {
      console.error("[v0] Error updating event:", error)
      throw new Error("Error al actualizar evento en Google Sheets")
    }
  }
  

  // Observaciones




  // Devuelve las observaciones de un cliente (Id) ordenadas: más reciente arriba
async getObservacionesById(id: string): Promise<string[]> {
  // Buscamos la fila por número, como ya haces en getEventById
  const rowNumber = Number.parseInt(id) + 1 // +1 por header
  const response = await this.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
  })
  const row = (response.data.values?.[0] ?? [])

  // Tomamos Observacion1..8 (index 23..30). Suponemos que 1 es la más antigua y 8 la más reciente.
  const obs = OBS_COLUMNS.map(c => (row[c.index] ?? '').toString().trim())
    .filter(Boolean)

  // Orden descendente por "reciente": Observacion8 → Observacion1
  const ordered = OBS_COLUMNS
    .slice() // copia
    .reverse()
    .map(c => (row[c.index] ?? '').toString().trim())
    .filter(Boolean)

  return ordered
}



// Escribe la nueva observación en la primera columna ObservacionN vacía (1..8)
// Devuelve la clave de columna usada (p.ej. 'Observacion3') o lanza error si está lleno.
async addObservacion(id: string, texto: string): Promise<{ usedKey: string }> {
  const rowNumber = Number.parseInt(id) + 1 // +1 por header
  const getResp = await this.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
  })
  const row = (getResp.data.values?.[0] ?? [])

  // Encontrar la PRIMERA vacía (número más chico) entre Observacion1..8
  const emptyCol = OBS_COLUMNS.find(c => !row[c.index] || `${row[c.index]}`.trim() === '')
  if (!emptyCol) {
    throw new Error('No hay columnas Observacion disponibles (1..8 ya completas).')
  }

  // Actualizar solo esa celda
  const targetRange = `${SHEET_NAME}!${emptyCol.letter}${rowNumber}`
  await this.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: targetRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[texto]] },
  })

  return { usedKey: emptyCol.key }
}


}




