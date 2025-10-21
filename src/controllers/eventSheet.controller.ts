import type { Request, Response } from "express"
import { EventSheetService } from "../services/eventSheet.service"

const eventSheetService = new EventSheetService()

export class EventSheetController {
  // 🔹 Obtener todos los eventos (incluye observacionesList)
  async getAllEvents(req: Request, res: Response) {
    try {
      const events = await eventSheetService.getAllEvents()
      res.json({
        success: true,
        data: events,
        count: events.length,
      })
    } catch (error) {
      console.error("[Controller] Error en getAllEvents:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al obtener eventos",
      })
    }
  }

  // 🔹 Obtener evento por ID (incluye observacionesList)
  async getEventById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const event = await eventSheetService.getEventById(id)

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Evento no encontrado",
        })
      }

      res.json({
        success: true,
        data: event,
      })
    } catch (error) {
      console.error("[Controller] Error en getEventById:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al obtener evento",
      })
    }
  }

  // 🔹 Crear nuevo evento
  async createEvent(req: Request, res: Response) {
    try {
      const eventData = req.body
      const newEvent = await eventSheetService.createEvent(eventData)

      res.status(201).json({
        success: true,
        data: newEvent,
        message: "Evento creado exitosamente",
      })
    } catch (error) {
      console.error("[Controller] Error en createEvent:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al crear evento",
      })
    }
  }

  // 🔹 Actualizar evento existente
  async updateEvent(req: Request, res: Response) {
    try {
      const { id } = req.params
      const eventData = req.body
      const updatedEvent = await eventSheetService.updateEvent(id, eventData)

      if (!updatedEvent) {
        return res.status(404).json({
          success: false,
          message: "Evento no encontrado",
        })
      }

      res.json({
        success: true,
        data: updatedEvent,
        message: "Evento actualizado exitosamente",
      })
    } catch (error) {
      console.error("[Controller] Error en updateEvent:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al actualizar evento",
      })
    }
  }

  // 🔹 Obtener observaciones de un cliente (ordenadas, más reciente arriba)
  async getObservacionesById(req: Request, res: Response) {
    try {
      const { id } = req.params
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Falta el parámetro ID",
        })
      }

      const observaciones = await eventSheetService.getObservacionesById(id)
      res.json({
        success: true,
        data: observaciones,
        count: observaciones.length,
      })
    } catch (error) {
      console.error("[Controller] Error en getObservacionesById:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al obtener observaciones",
      })
    }
  }

  // 🔹 Agregar una nueva observación (primera columna vacía)
  async addObservacion(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { texto } = req.body as { texto?: string }

      if (!id || !texto || !texto.trim()) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos: id o texto",
        })
      }

      const result = await eventSheetService.addObservacion(id, texto.trim())

      res.status(201).json({
        success: true,
        data: result,
        message: `Observación añadida correctamente (${result.usedKey})`,
      })
    } catch (error) {
      console.error("[Controller] Error en addObservacion:", error)
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al agregar observación",
      })
    }
  }
}
