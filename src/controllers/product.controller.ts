import type { Request, Response, NextFunction } from "express"
import { ProductService } from "../services/product.service"

export class ProductController {
  private productService: ProductService

  constructor() {
    this.productService = new ProductService()
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.productService.getAllProducts()
      res.status(200).json({
        success: true,
        data: products,
      })
    } catch (error) {
      next(error)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const product = await this.productService.getProductById(id)

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productData = req.body
      const newProduct = await this.productService.createProduct(productData)

      res.status(201).json({
        success: true,
        data: newProduct,
        message: "Producto creado exitosamente",
      })
    } catch (error) {
      next(error)
    }
  }
}
