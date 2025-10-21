import type { User } from "../types/user.types"

export class UserService {
  // Simulación de datos - aquí conectarías tu base de datos
  private users: User[] = [
    { id: "1", name: "Juan Pérez", email: "juan@example.com", createdAt: new Date() },
    { id: "2", name: "María García", email: "maria@example.com", createdAt: new Date() },
  ]

  async getAllUsers(): Promise<User[]> {
    return this.users
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id)
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser: User = {
      id: String(this.users.length + 1),
      ...userData,
      createdAt: new Date(),
    }
    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex((user) => user.id === id)
    if (index === -1) return null

    this.users[index] = { ...this.users[index], ...userData }
    return this.users[index]
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex((user) => user.id === id)
    if (index === -1) return false

    this.users.splice(index, 1)
    return true
  }
}
