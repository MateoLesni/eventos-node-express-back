import { Router } from "express"
import { UserController } from "../controllers/user.controller"
import { validateRequest } from "../middlewares/validate.middleware"

const router = Router()
const userController = new UserController()

router.get("/", userController.getAll)
router.get("/:id", userController.getById)
router.post("/", validateRequest, userController.create)
router.put("/:id", validateRequest, userController.update)
router.delete("/:id", userController.delete)

export default router
