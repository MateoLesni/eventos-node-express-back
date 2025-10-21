import type { Request, Response, NextFunction } from "express"
import { UserService } from "../services/user.service"

export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAllUsers()
      res.status(200).json({
        success: true,
        data: users,
      })
    } catch (error) {
      next(error)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const user = await this.userService.getUserById(id)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body
      const newUser = await this.userService.createUser(userData)

      res.status(201).json({
        success: true,
        data: newUser,
        message: "Usuario creado exitosamente",
      })
    } catch (error) {
      next(error)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const userData = req.body
      const updatedUser = await this.userService.updateUser(id, userData)

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: "Usuario actualizado exitosamente",
      })
    } catch (error) {
      next(error)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      await this.userService.deleteUser(id)

      res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente",
      })
    } catch (error) {
      next(error)
    }
  }
}
