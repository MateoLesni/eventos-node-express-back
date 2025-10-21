export class ApiResponse {
  static success(data: any, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message }),
    }
  }

  static error(message: string, statusCode = 500) {
    return {
      success: false,
      message,
      statusCode,
    }
  }
}
