import type { Product } from "../types/product.types"

export class ProductService {
  // Simulación de datos - aquí conectarías tu base de datos
  private products: Product[] = [
    { id: "1", name: "Laptop", price: 999.99, stock: 10 },
    { id: "2", name: "Mouse", price: 29.99, stock: 50 },
  ]

  async getAllProducts(): Promise<Product[]> {
    return this.products
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.find((product) => product.id === id)
  }

  async createProduct(productData: Omit<Product, "id">): Promise<Product> {
    const newProduct: Product = {
      id: String(this.products.length + 1),
      ...productData,
    }
    this.products.push(newProduct)
    return newProduct
  }
}
