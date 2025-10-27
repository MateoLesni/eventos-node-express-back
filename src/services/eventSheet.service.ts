import type { EventSheet, CreateEventSheetDTO, UpdateEventSheetDTO } from "../types/eventSheet.types"
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME } from "../config/googleSheets.config"
import { google } from "googleapis"

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

// Columnas puntuales en hoja principal
const COL = {
  ESTADO: { letter: "W", index: 22 },          // W
  RECHAZO_MOTIVO: { letter: "AO", index: 40 }, // AO
}

// === Auditoría ===
const AUDIT_SHEET_NAME = process.env.AUDIT_SHEET_NAME || "Auditoria"
// A: Fecha, B: ID Cliente, C: Fila, D: Campo, E: Valor Anterior, F: Valor Nuevo, G: Usuario, H: Origen, I: Nota
const AUDIT_RANGE = `${AUDIT_SHEET_NAME}!A:I`

// Etiquetas legibles para los campos (aparecen en “Campo”)
const LABELS: Record<string, string> = {
  fechaCliente: "Fecha Cliente",
  horaCliente: "Hora Cliente",
  nombre: "Nombre",
  telefono: "Telefono",
  mail: "Mail",
  lugar: "Lugar",
  cantidadPersonas: "Cantidad de Personas",
  observacion: "Observacion",
  redireccion: "Redireccion",
  canal: "Canal",
  respuestaViaMail: "Respuesta Via Mail",
  asignacionComercialMail: "Asignación Comercial Mail",
  horarioInicioEvento: "Horario Inicio Evento",
  horarioFinalizacionEvento: "Horario Finalización Evento",
  fechaEvento: "Fecha Evento",
  sector: "Sector",
  vendedorComercialAsignado: "Vendedor Comercial Asignado",
  marcaTemporal: "Marca Temporal",
  demora: "Demora",
  presupuesto: "Presupuesto",
  fechaPresupEnviado: "Fecha Presup Enviado",
  estado: "Estado",
  rechazoMotivo: "Motivo Rechazo",
}

type ObsItem = { texto: string; fecha: string }
type AuditEntry = {
  id?: string
  rowNumber?: number
  campo: string
  antes: string
  despues: string
  usuario?: string
  origen?: string
  nota?: string
}

export class EventSheetService {
  private sheets = getGoogleSheetsClient()

  // ---------- util ----------
// 🔧 Reemplazá COMPLETO este método en EventSheetService
    private async ensureAuditSheetExists(): Promise<void> {
      // usar SIEMPRE el cliente ya autenticado: this.sheets
      const meta = await this.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        includeGridData: false,
      })

      const has = meta.data.sheets?.some(s => s.properties?.title === AUDIT_SHEET_NAME)
      if (has) return

      // crear la hoja "Auditoria"
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: AUDIT_SHEET_NAME } } }],
        },
      })

  // setear encabezados
  await this.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${AUDIT_SHEET_NAME}!A1:I1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "Fecha", "ID Cliente", "Fila", "Campo", "Valor Anterior",
        "Valor Nuevo", "Usuario", "Origen", "Nota",
      ]],
    },
  })
}


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

  private parseRowFromUpdatedRange(updatedRange?: string | null): number | undefined {
    // Ej: "Base!A123:W123" → 123
    if (!updatedRange) return
    const m = /[A-Za-z]+(\d+):/.exec(updatedRange.split("!").pop() || "")
    return m ? Number(m[1]) : undefined
  }

  private toLabel(key: string) {
    return LABELS[key] || key
  }

  private async appendAudit(entries: AuditEntry[]) {
    if (!entries.length) return
    await this.ensureAuditSheetExists()
    const values = entries.map(e => ([
      this.nowAR(),
      e.id || "",
      e.rowNumber ? String(e.rowNumber) : "",
      e.campo,
      e.antes ?? "",
      e.despues ?? "",
      e.usuario || "",
      e.origen || "BACK",
      e.nota || "",
    ]))
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: AUDIT_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    })
  }

  // ---------- hoja principal ----------
  private async findRowNumberById(rawId: string): Promise<number | null> {
    const id = (rawId || "").replace(/^:/, "")
    const resp = await this.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    })
    const ids = resp.data.values?.map((r) => r[0]?.toString() ?? "") ?? []
    const idx = ids.findIndex((v) => v === id)
    if (idx === -1) return null
    return idx + 2
  }

  private rowToEventSheet(row: any[], _rowIndex: number): EventSheet & { observacionesList: ObsItem[] } {
    const base: EventSheet = {
      id: String(row[0] || ""),
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

    const observacionesList: ObsItem[] = OBS_COLUMNS.map((c, i) => {
      const texto = (row[c.index] ?? "").toString().trim()
      const fecha = (row[FECHA_COLUMNS[i].index] ?? "").toString().trim()
      return { texto, fecha }
    })
      .filter((o) => o.texto)
      .reverse()

    return { ...base, observacionesList }
  }

  private eventSheetToRow(event: CreateEventSheetDTO | UpdateEventSheetDTO, id?: string): any[] {
    return [
      id || "", // A
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
      event.fechaEvento || "", // P
      event.sector || "",
      event.vendedorComercialAsignado || "",
      event.marcaTemporal || "",
      event.demora || "",
      event.presupuesto || "",
      event.fechaPresupEnviado || "",
      event.estado || "",
    ]
  }

  async getAllEvents(): Promise<(EventSheet & { observacionesList: ObsItem[] })[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:AM`,
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

  // ====== CREATE ====== (A queda vacía; audita cada campo seteado)
  async createEvent(
    eventData: CreateEventSheetDTO,
    opts?: { usuario?: string; origen?: string } // opcional
  ): Promise<EventSheet> {
    try {
      // construir fila con A = "" (ID vacío)
      const newRow = this.eventSheetToRow(eventData, "")
      const resp = await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:AM`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [newRow] },
      })

      // obtener número de fila insertada
      const rowNumber = this.parseRowFromUpdatedRange(resp.data.updates?.updatedRange)

      // AUDITORÍA: una entrada por cada campo no vacío en la creación
      const entries: AuditEntry[] = []
      const keys: (keyof CreateEventSheetDTO)[] = [
        "fechaCliente","horaCliente","nombre","telefono","mail","lugar",
        "cantidadPersonas","observacion","redireccion","canal",
        "respuestaViaMail","asignacionComercialMail","horarioInicioEvento",
        "horarioFinalizacionEvento","fechaEvento","sector",
        "vendedorComercialAsignado","marcaTemporal","demora","presupuesto",
        "fechaPresupEnviado","estado"
      ]
      keys.forEach(k => {
        const v = (eventData as any)[k]
        if (v != null && String(v).trim() !== "") {
          entries.push({
            rowNumber,
            campo: this.toLabel(String(k)),
            antes: "",
            despues: String(v),
            usuario: opts?.usuario,
            origen: opts?.origen || "BACK",
            nota: "Alta de registro",
          })
        }
      })
      await this.appendAudit(entries)

      // devolvemos sin ID (lo completa tu Apps Script)
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

  // ====== UPDATE ====== (audita cada campo cambiado)
  async updateEvent(
    id: string,
    eventData: UpdateEventSheetDTO & { rechazoMotivo?: string },
    opts?: { usuario?: string; origen?: string }
  ): Promise<EventSheet | null> {
    try {
      const rowNumber = await this.findRowNumberById(id)
      if (!rowNumber) return null

      // Leer fila actual
      const currentResp = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:AM${rowNumber}`,
      })
      const currentRow = currentResp.data.values?.[0] ?? []
      const currentEvent = this.rowToEventSheet(currentRow, rowNumber - 2)

      const { rechazoMotivo, ...rowData } = (eventData ?? {}) as any

      const updatedEvent: EventSheet = { ...currentEvent, ...rowData }

      // Timestamps automáticos (igual que tenías)
      const wroteAnyHorario =
        Boolean(rowData.horarioInicioEvento) ||
        Boolean(rowData.horarioFinalizacionEvento)

      if (wroteAnyHorario && !currentEvent.marcaTemporal) {
        updatedEvent.marcaTemporal = this.nowAR()
      }
      if (typeof rowData.presupuesto === "string" && rowData.presupuesto.trim() && !currentEvent.fechaPresupEnviado) {
        updatedEvent.fechaPresupEnviado = this.nowAR()
      }

      // ¿Qué cambió?
      const baseKeys: (keyof EventSheet)[] = [
        "fechaCliente","horaCliente","nombre","telefono","mail","lugar",
        "cantidadPersonas","observacion","redireccion","canal",
        "respuestaViaMail","asignacionComercialMail","horarioInicioEvento",
        "horarioFinalizacionEvento","fechaEvento","sector",
        "vendedorComercialAsignado","marcaTemporal","demora","presupuesto",
        "fechaPresupEnviado","estado"
      ]

      const changedMap: Record<string, { antes: string; despues: string }> = {}
      baseKeys.forEach(k => {
        const before = (currentEvent as any)[k] ?? ""
        const after  = (updatedEvent as any)[k] ?? ""
        if (String(before) !== String(after)) {
          changedMap[String(k)] = { antes: String(before), despues: String(after) }
        }
      })

      // 1) Persistir cambios en la hoja principal (A..W)
      if (Object.keys(changedMap).length > 0) {
        const updatedRow = this.eventSheetToRow(updatedEvent, id)
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${rowNumber}:${COL.ESTADO.letter}${rowNumber}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [updatedRow] },
        })
      }

      // 2) Motivo de rechazo (AO) si vino
      if (typeof rechazoMotivo === "string" && rechazoMotivo.trim() !== "") {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!${COL.RECHAZO_MOTIVO.letter}${rowNumber}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[rechazoMotivo.trim()]] },
        })
        changedMap["rechazoMotivo"] = { antes: "", despues: rechazoMotivo.trim() }
        ;(updatedEvent as any).rechazoMotivo = rechazoMotivo.trim()
      }

      // 3) AUDITORÍA: una fila por campo cambiado
      if (Object.keys(changedMap).length > 0) {
        const entries: AuditEntry[] = Object.entries(changedMap).map(([k, v]) => ({
          id,
          rowNumber,
          campo: this.toLabel(k),
          antes: v.antes,
          despues: v.despues,
          usuario: opts?.usuario,
          origen: opts?.origen || "BACK",
        }))
        await this.appendAudit(entries)
      }

      return updatedEvent
    } catch (error: any) {
      const gErr = error?.response?.data || error?.message || error
      console.error("[v0] Error updating event (details):", gErr)
      throw new Error("Error al actualizar evento en Google Sheets")
    }
  }

  // --------- Observaciones (sin cambios) ---------
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
