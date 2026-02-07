class AppError extends Error {
  public statusCode: number;
  public status: string;
  public details?: object;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, details?: object) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;