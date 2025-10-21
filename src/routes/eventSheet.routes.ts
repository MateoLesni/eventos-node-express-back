import { Router } from "express"
import { EventSheetController } from "../controllers/eventSheet.controller"

const router = Router()
const eventSheetController = new EventSheetController()

// GET /api/eventSheet - Obtener todos los eventos
router.get("/", eventSheetController.getAllEvents)

// ⚠️ IMPORTANTE: poner estas rutas ANTES de "/:id"
//
// GET /api/eventSheet/:id/observaciones - Listar observaciones (orden: más reciente arriba)
router.get("/:id/observaciones", eventSheetController.getObservacionesById)

// POST /api/eventSheet/:id/observaciones - Añadir observación (usa primera columna ObservacionN vacía)
router.post("/:id/observaciones", eventSheetController.addObservacion)

// GET /api/eventSheet/:id - Obtener evento por ID
router.get("/:id", eventSheetController.getEventById)

// POST /api/eventSheet - Crear nuevo evento
router.post("/", eventSheetController.createEvent)

// PUT /api/eventSheet/:id - Actualizar evento
router.put("/:id", eventSheetController.updateEvent)

export default router
