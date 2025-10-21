export interface Product {
  id: string
  name: string
  price: number
  stock: number
}

export interface CreateProductDTO {
  name: string
  price: number
  stock: number
}
