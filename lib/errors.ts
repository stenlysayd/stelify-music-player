export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return { message: error.message, status: error.status };
  }

  return { message: "Internal Server Error", status: 500 };
}
