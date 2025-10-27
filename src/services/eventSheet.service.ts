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

// Columnas puntuales
const COL = {
  ESTADO: { letter: "W", index: 22 },          // columna W (0-based index 22)
  RECHAZO_MOTIVO: { letter: "AO", index: 40 }, // columna AO (0-based index 40)
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

  // Fecha/hora local AR para guardar en Sheets
  private nowAR(): string {
    try {
      return new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date())
    } catch {
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
      fechaEvento: row[15] || "", // <-- Columna P
      sector: row[16] || "",
      vendedorComercialAsignado: row[17] || "",
      marcaTemporal: row[18] || "",
      demora: row[19] || "",
      presupuesto: row[20] || "",
      fechaPresupEnviado: row[21] || "",
      estado: row[22] || "",
    }

    // Observacion1..8 + FechaObs1..8 → más recientes arriba
    const observacionesList: ObsItem[] = OBS_COLUMNS.map((c, i) => {
      const texto = (row[c.index] ?? "").toString().trim()
      const fecha = (row[FECHA_COLUMNS[i].index] ?? "").toString().trim()
      return { texto, fecha }
    })
      .filter((o) => o.texto)
      .reverse()

    return { ...base, observacionesList }
  }

  // Convertir objeto EventSheet a fila de Google Sheets (A..W)
  private eventSheetToRow(event: CreateEventSheetDTO | UpdateEventSheetDTO, id?: string): any[] {
    return [
      id || "", // Id (columna A) — en creación se pasa "" para que quede vacía
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
      event.fechaEvento || "", // <-- P
      event.sector || "",
      event.vendedorComercialAsignado || "",
      event.marcaTemporal || "",
      event.demora || "",
      event.presupuesto || "",
      event.fechaPresupEnviado || "",
      event.estado || "",
      // Observacion1..8 y FechaObs1..8 se manejan por addObservacion()
    ]
  }

  async getAllEvents(): Promise<(EventSheet & { observacionesList: ObsItem[] })[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:AM`, // incluye FechaObs1..8
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

  // ====== CREATE ====== (NO escribir ID: A queda vacía y NO se corre nada)
async createEvent(eventData: CreateEventSheetDTO): Promise<EventSheet> {
  try {
    // Fila completa A..W con A = "" (ID vacío)
    const newRow = this.eventSheetToRow(eventData, "")

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AM`,            // <-- volvemos a A:AM
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [newRow] },      // <-- enviamos TODA la fila, sin slice()
    })

    // Devolvemos sin ID (lo completa tu Apps Script)
    return {
      id: "",
      fechaCliente: eventData.fechaCliente || "",
      horaCliente: eventData.horaCliente || "",
      nombre: eventData.nombre || "",
      telefono: eventData.telefono || "",
      mail: eventData.mail || "",
      lugar: eventData.lugar || "",
      cantidadPersonas: eventData.cantidadPersonas || "",
      observacion: eventData.observacion || "",
      redireccion: eventData.redireccion || "",
      canal: eventData.canal || "",
      respuestaViaMail: eventData.respuestaViaMail || "",
      asignacionComercialMail: eventData.asignacionComercialMail || "",
      horarioInicioEvento: eventData.horarioInicioEvento || "",
      horarioFinalizacionEvento: eventData.horarioFinalizacionEvento || "",
      fechaEvento: eventData.fechaEvento || "",   // <-- impacta en P
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


  // --- UPDATE EVENT (A..W) + estado (W) + rechazoMotivo (AO) ---
  async updateEvent(
    id: string,
    eventData: UpdateEventSheetDTO & { rechazoMotivo?: string }
  ): Promise<EventSheet | null> {
    try {
      const rowNumber = await this.findRowNumberById(id)
      if (!rowNumber) return null

      // Leer fila actual (A..AM para tener fechas de observaciones)
      const currentResp = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AM${rowNumber}`,
      })
      const currentRow = currentResp.data.values?.[0] ?? []
      const currentEvent = this.rowToEventSheet(currentRow, rowNumber - 2)

      // Separamos el motivo de rechazo (AO)
      const { rechazoMotivo, ...rowData } = (eventData ?? {}) as any

      // Merge SOLO base (A..W)
      const updatedEvent: EventSheet = { ...currentEvent, ...rowData }

      // TIMESTAMPS automáticos
      const wroteAnyHorario =
        Boolean(rowData.horarioInicioEvento) ||
        Boolean(rowData.horarioFinalizacionEvento)

      if (wroteAnyHorario && !currentEvent.marcaTemporal) {
        updatedEvent.marcaTemporal = this.nowAR()
      }

      if (
        typeof rowData.presupuesto === "string" &&
        rowData.presupuesto.trim() &&
        !currentEvent.fechaPresupEnviado
      ) {
        updatedEvent.fechaPresupEnviado = this.nowAR()
      }

      // ¿Cambió algo real en A..W?
      const baseKeys: (keyof EventSheet)[] = [
        "fechaCliente","horaCliente","nombre","telefono","mail","lugar",
        "cantidadPersonas","observacion","redireccion","canal",
        "respuestaViaMail","asignacionComercialMail","horarioInicioEvento",
        "horarioFinalizacionEvento","fechaEvento","sector",
        "vendedorComercialAsignado","marcaTemporal","demora","presupuesto",
        "fechaPresupEnviado","estado"
      ]
      const changedBase = baseKeys.some(k => (updatedEvent as any)[k] !== (currentEvent as any)[k])

      // 1) Si cambió algo del bloque base, actualizamos A..W (ID queda igual)
      if (changedBase) {
        const updatedRow = this.eventSheetToRow(updatedEvent, id) // A..W
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${rowNumber}:${COL.ESTADO.letter}${rowNumber}`, // A..W
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [updatedRow] },
        })
      }

      // 2) Si vino 'estado', reforzamos W{fila} (opcional)
      if (typeof rowData.estado === "string" && rowData.estado.trim() !== "") {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${COL.ESTADO.letter}${rowNumber}`, // W{fila}
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[rowData.estado.trim()]] },
        })
      }

      // 3) Si vino 'rechazoMotivo', escribimos AO{fila}
      if (typeof rechazoMotivo === "string" && rechazoMotivo.trim() !== "") {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${COL.RECHAZO_MOTIVO.letter}${rowNumber}`, // AO{fila}
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[rechazoMotivo.trim()]] },
        })
        ;(updatedEvent as any).rechazoMotivo = rechazoMotivo.trim()
      }

      return updatedEvent
    } catch (error: any) {
      const gErr = error?.response?.data || error?.message || error
      console.error("[v0] Error updating event (details):", gErr)
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

    // Escribir texto y fecha (estática)
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
