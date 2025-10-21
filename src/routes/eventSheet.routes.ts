import { Router } from "express"
import { EventSheetController } from "../controllers/eventSheet.controller"

const router = Router()
const eventSheetController = new EventSheetController()

// GET /api/eventSheet - Obtener todos los eventos
router.get("/", eventSheetController.getAllEvents)

// GET /api/eventSheet/:id - Obtener evento por ID
router.get("/:id", eventSheetController.getEventById)

// POST /api/eventSheet - Crear nuevo evento
router.post("/", eventSheetController.createEvent)

// PUT /api/eventSheet/:id - Actualizar evento
router.put("/:id", eventSheetController.updateEvent)

export default router
