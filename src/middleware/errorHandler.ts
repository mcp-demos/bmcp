import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";
import { config } from "../config/environment";

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error"; // Log error

  console.error("Error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  }); // MongoDB duplicate key error

  if (error.code === 11000) {
    statusCode = 400;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
  } // MongoDB validation error

  if (error.name === "ValidationError") {
    statusCode = 400;
    const validationErrors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
    const response: ApiResponse = {
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    };
    res.status(statusCode).json(response);
    return;
  } // MongoDB cast error (invalid ObjectId)

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } // JWT errors

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } // CORS error

  if (error.message === "Not allowed by CORS") {
    statusCode = 403;
    message = "CORS policy violation";
  } // Rate limit error

  if (error.message && error.message.includes("Too many requests")) {
    statusCode = 429;
  }

  const response: ApiResponse = {
    success: false,
    message,
  }; // Include stack trace in development

  if (config.NODE_ENV === "development") {
    (response as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
};

// Unhandled promise rejection handler
export const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("Unhandled Promise Rejection:", reason);
    console.error("Promise:", promise); // Close server gracefully
    process.exit(1);
  });
};

// Uncaught exception handler
export const handleUncaughtException = () => {
  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error); // Close server gracefully
    process.exit(1);
  });
};
