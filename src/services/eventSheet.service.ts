import type { EventSheet, CreateEventSheetDTO, UpdateEventSheetDTO } from "../types/eventSheet.types"
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME } from "../config/googleSheets.config"

// Columnas de Observación (A=0 … W=22 ⇒ X=23 … AE=30)
const OBS_COLUMNS = [
  { key: "Observacion1", index: 23, letter: "X" },
  { key: "Observacion2", index: 24, letter: "Y" },
  { key: "Observacion3", index: 25, letter: "Z" },
  { key: "Observacion4", index: 26, letter: "AA" },
  { key: "Observacion5", index: 27, letter: "AB" },
  { key: "Observacion6", index: 28, letter: "AC" },
  { key: "Observacion7", index: 29, letter: "AD" },
  { key: "Observacion8", index: 30, letter: "AE" },
]

export class EventSheetService {
  private sheets = getGoogleSheetsClient()

  // Buscar número de fila (1-based) por Id en la columna A
  private async findRowNumberById(rawId: string): Promise<number | null> {
    const id = (rawId || "").replace(/^:/, "") // por si viene con ":" al inicio
    const resp = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`, // solo IDs desde la fila 2
    })
    const ids = resp.data.values?.map((r) => r[0]?.toString() ?? "") ?? []
    const idx = ids.findIndex((v) => v === id)
    if (idx === -1) return null
    return idx + 2 // A2 es fila 2 ⇒ sumamos 2
  }

  // Convertir fila de Google Sheets a objeto EventSheet (+ observacionesList)
  // 👇 devolvemos EventSheet + observacionesList
private rowToEventSheet(
  row: any[],
  _rowIndex: number
): EventSheet & { observacionesList: string[] } {
  const base: EventSheet = {
    id: String(row[0] || ""), // Col A (Id)
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

  // Observacion1..8 (más reciente arriba)
  const observacionesList = OBS_COLUMNS
    .slice()
    .reverse()
    .map(c => (row[c.index] ?? "").toString().trim())
    .filter(Boolean)

  return { ...base, observacionesList }
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
      // NOTA: no escribimos Observacion1..8 desde acá; las maneja addObservacion
    ]
  }

  async getAllEvents(): Promise<(EventSheet & { observacionesList: string[] })[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:AE`, // incluye Observacion1..8
      })

      const rows = response.data.values || []
      return rows.map((row, index) => this.rowToEventSheet(row, index))
    } catch (error) {
      console.error("[v0] Error getting all events:", error)
      throw new Error("Error al obtener eventos de Google Sheets")
    }
  }

  async getEventById(id: string): Promise<(EventSheet & { observacionesList: string[] }) | null> {
    try {
      const rowNumber = await this.findRowNumberById(id)
      if (!rowNumber) return null

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
      })

      const rows = response.data.values || []
      if (rows.length === 0) return null

      return this.rowToEventSheet(rows[0], rowNumber - 2)
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
      // Buscar fila por Id en col A
      const rowNumber = await this.findRowNumberById(id)
      if (!rowNumber) return null

      // Obtener el actual (para merge)
      const currentResp = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
      })
      const currentRow = currentResp.data.values?.[0] ?? []
      const currentEvent = this.rowToEventSheet(currentRow, rowNumber - 2)

      // Mezclar con los nuevos datos
      const updatedEvent = { ...currentEvent, ...eventData }
      const updatedRow = this.eventSheetToRow(updatedEvent, id)

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [updatedRow],
        },
      })

      // Devolvemos sin observacionesList recalculada (opcional recalcular)
      return updatedEvent
    } catch (error) {
      console.error("[v0] Error updating event:", error)
      throw new Error("Error al actualizar evento en Google Sheets")
    }
  }

  // --------- Observaciones ---------

  // Devolver observaciones (string[]) para un cliente por Id (más reciente arriba)
  async getObservacionesById(id: string): Promise<string[]> {
    const rowNumber = await this.findRowNumberById(id)
    if (!rowNumber) return []

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
    })
    const row = response.data.values?.[0] ?? []

    const ordered = OBS_COLUMNS.slice()
      .reverse()
      .map((c) => (row[c.index] ?? "").toString().trim())
      .filter(Boolean)

    return ordered
  }

  // Agregar observación en la primera columna ObservacionN vacía (1..8)
  async addObservacion(id: string, texto: string): Promise<{ usedKey: string }> {
    const rowNumber = await this.findRowNumberById(id)
    if (!rowNumber) throw new Error("Id no encontrado en la columna A")

    const getResp = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:AE${rowNumber}`,
    })
    const row = getResp.data.values?.[0] ?? []

    const emptyCol = OBS_COLUMNS.find((c) => !row[c.index] || `${row[c.index]}`.trim() === "")
    if (!emptyCol) throw new Error("No hay columnas Observacion disponibles (1..8 ya completas).")

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
