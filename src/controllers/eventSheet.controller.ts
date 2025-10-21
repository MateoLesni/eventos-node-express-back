import type { Request, Response } from "express"
import { EventSheetService } from "../services/eventSheet.service"

const eventSheetService = new EventSheetService()

export class EventSheetController {
  async getAllEvents(req: Request, res: Response) {
    try {
      const events = await eventSheetService.getAllEvents()
      res.json({
        success: true,
        data: events,
        count: events.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al obtener eventos",
      })
    }
  }

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
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al obtener evento",
      })
    }
  }

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
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al crear evento",
      })
    }
  }

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
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al actualizar evento",
      })
    }
  }
}
