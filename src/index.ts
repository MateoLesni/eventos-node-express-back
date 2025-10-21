import express, { type Application } from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { errorHandler } from "./middlewares/error.middleware"
import { notFoundHandler } from "./middlewares/not-found.middleware"
import routes from "./routes"

const app: Application = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(helmet())
app.use(cors())
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Routes
app.use("/api", routes)

// Error handlers
app.use(notFoundHandler)
app.use(errorHandler)

// Start server (solo en desarrollo, Vercel maneja esto en producción)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

export default app
