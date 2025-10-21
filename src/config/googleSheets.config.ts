import { google } from "googleapis"
import dotenv from "dotenv";

dotenv.config()

// Configuración de Google Sheets
export const getGoogleSheetsClient = () => {
  console.log(process.env.GOOGLE_AUTH_URI, 'google auth uri -----------------')
  const credentials = {
    type: process.env.GOOGLE_TYPE || "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url:
      process.env.GOOGLE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com",
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  return google.sheets({ version: "v4", auth })
}

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "1VCNOTi8X2uzSiZxCmdgfl4tTRjn0iE6Ruz9KXQUfi5E"
export const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Base Mail"
