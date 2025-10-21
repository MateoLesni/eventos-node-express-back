import { Router } from "express"
import userRoutes from "./user.routes"
import productRoutes from "./product.routes"
import eventSheetRoutes from "./eventSheet.routes"

const router = Router()

// Registrar todas las rutas aquí
router.use("/users", userRoutes)
router.use("/products", productRoutes)
router.use("/eventSheet", eventSheetRoutes)

export default router
