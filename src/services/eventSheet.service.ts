import type { EventSheet, CreateEventSheetDTO, UpdateEventSheetDTO } from "../types/eventSheet.types"
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME } from "../config/googleSheets.config"

// Observaciones (A=0 … W=22 ⇒ X=23 … AE=30)
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

// Fechas de observaciones (AF=31 … AM=38) en el mismo orden 1..8
const FECHA_COLUMNS = [
  { key: "FechaObs1", index: 31, letter: "AF" },
  { key: "FechaObs2", index: 32, letter: "AG" },
  { key: "FechaObs3", index: 33, letter: "AH" },
  { key: "FechaObs4", index: 34, letter: "AI" },
  { key: "FechaObs5", index: 35, letter: "AJ" },
  { key: "FechaObs6", index: 36, letter: "AK" },
  { key: "FechaObs7", index: 37, letter: "AL" },
  { key: "FechaObs8", index: 38, letter: "AM" },
]

// Fecha/hora local Argentina: "dd/mm/aaaa hh:mm"
function nowAR(): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date())
  } catch {
    // fallback
    return new Date().toISOString()
  }
}



type ObsItem = { texto: string; fecha: string }

export class EventSheetService {
  private sheets = getGoogleSheetsClient()

  // Buscar número de fila (1-based) por Id en la columna A
  private async findRowNumberById(rawId: string): Promise<number | null> {
    const id = (rawId || "").replace(/^:/, "")
    const resp = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    })
    const ids = resp.data.values?.map((r) => r[0]?.toString() ?? "") ?? []
    const idx = ids.findIndex((v) => v === id)
    if (idx === -1) return null
    return idx + 2 // A2 es fila 2
  }

  // Formato de fecha estático para guardar en Sheets
  private nowAR(): string {
    try {
      // Fecha y hora local de Argentina
      return new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date())
    } catch {
      // Fallback ISO
      return new Date().toISOString()
    }
  }

  // Convertir fila de Google Sheets a objeto EventSheet (+ observacionesList con fecha)
  private rowToEventSheet(
    row: any[],
    _rowIndex: number
  ): EventSheet & { observacionesList: ObsItem[] } {
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

    // Construir [{texto, fecha}] de Observacion1..8 + FechaObs1..8
    // Suponemos que 1 es más antiguo y 8 el más reciente → mostramos 8..1
    const observacionesList: ObsItem[] = OBS_COLUMNS.map((c, i) => {
      const texto = (row[c.index] ?? "").toString().trim()
      const fecha = (row[FECHA_COLUMNS[i].index] ?? "").toString().trim()
      return { texto, fecha }
    })
      .filter((o) => o.texto) // solo con texto
      .reverse() // más recientes arriba

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
      // Observacion1..8 y FechaObs1..8 se manejan en addObservacion()
    ]
  }

  async getAllEvents(): Promise<(EventSheet & { observacionesList: ObsItem[] })[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:AM`, // ahora incluye FechaObs1..8
      })
      const rows = response.data.values || []
      return rows.map((row, index) => this.rowToEventSheet(row, index))
    } catch (error) {
      console.error("[v0] Error getting all events:", error)
      throw new Error("Error al obtener eventos de Google Sheets")
    }
  }

  async getEventById(id: string): Promise<(EventSheet & { observacionesList: ObsItem[] }) | null> {
    try {
      const rowNumber = await this.findRowNumberById(id)
      if (!rowNumber) return null

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AM${rowNumber}`,
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
      const allEvents = await this.getAllEvents()
      const newId = String(allEvents.length + 1)
      const newRow = this.eventSheetToRow(eventData, newId)

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:AM`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
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

    // Mezclar con los nuevos datos (aún sin timestamps)
    const updatedEvent: EventSheet = { ...currentEvent, ...eventData }

    // --- TIMESTAMPS AUTOMÁTICOS ---
    // Si cargaron horarios y Marca temporal (col S) está vacía => setearla
    const wroteAnyHorario =
      Boolean((eventData as any).horarioInicioEvento) ||
      Boolean((eventData as any).horarioFinalizacionEvento)

    if (wroteAnyHorario && !currentEvent.marcaTemporal) {
      updatedEvent.marcaTemporal = nowAR()
    }

    // Si cargaron Presupuesto y Fecha Presup. enviado (col V) está vacía => setearla
    if (typeof (eventData as any).presupuesto === "string" &&
        (eventData as any).presupuesto.trim() &&
        !currentEvent.fechaPresupEnviado) {
      updatedEvent.fechaPresupEnviado = nowAR()
    }
    // --- FIN TIMESTAMPS ---

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


  // --------- Observaciones ---------

  // Devolver observaciones [{texto, fecha}] para un cliente por Id (más reciente arriba)
  async getObservacionesById(id: string): Promise<ObsItem[]> {
    const rowNumber = await this.findRowNumberById(id)
    if (!rowNumber) return []

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:AM${rowNumber}`,
    })
    const row = response.data.values?.[0] ?? []

    const list: ObsItem[] = OBS_COLUMNS.map((c, i) => {
      const texto = (row[c.index] ?? "").toString().trim()
      const fecha = (row[FECHA_COLUMNS[i].index] ?? "").toString().trim()
      return { texto, fecha }
    })
      .filter((o) => o.texto)
      .reverse()

    return list
  }

  // Agregar observación: escribe en la primera ObservacionN vacía y su FechaObsN correspondiente
  async addObservacion(id: string, texto: string): Promise<{ usedKey: string; usedDateKey: string }> {
    const rowNumber = await this.findRowNumberById(id)
    if (!rowNumber) throw new Error("Id no encontrado en la columna A")

    const getResp = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowNumber}:AM${rowNumber}`,
    })
    const row = getResp.data.values?.[0] ?? []

    const idx = OBS_COLUMNS.findIndex((c) => !row[c.index] || `${row[c.index]}`.trim() === "")
    if (idx === -1) throw new Error("No hay columnas Observacion disponibles (1..8 ya completas).")

    const obsCol = OBS_COLUMNS[idx]
    const fechaCol = FECHA_COLUMNS[idx]

    const obsRange = `${SHEET_NAME}!${obsCol.letter}${rowNumber}`
    const fechaRange = `${SHEET_NAME}!${fechaCol.letter}${rowNumber}`

    // Escribir texto y fecha (estática) — dos updates simples
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: obsRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[texto]] },
    })

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: fechaRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[this.nowAR()]] },
    })

    return { usedKey: obsCol.key, usedDateKey: fechaCol.key }
  }
}
