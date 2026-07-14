import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  errors?: any[];
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors: { field: string; message: string }[] | undefined;

  if (err.name === "ZodError") {
    statusCode = 422;
    message = "Validation failed";
    errors = (err as any).issues?.map((e: any) => ({
      field: e.path?.join(".") || "unknown",
      message: e.message,
    }));
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  if ((err as any).code === 11000) {
    statusCode = 409;
    message = "Email already in use";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};
