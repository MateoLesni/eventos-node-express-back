import type { Request, Response, NextFunction } from "express"

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Aquí puedes agregar validaciones personalizadas
  // Por ejemplo, usando Zod, Joi, o express-validator

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "El cuerpo de la petición no puede estar vacío",
    })
  }

  next()
}
