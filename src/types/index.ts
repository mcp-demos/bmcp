import { Request } from "express";
import { Document } from "mongoose";

// user login response from the MCP client backend
export interface UserResponse {
//   userId: number;
//   tenantId: number;
  userUuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organizationUuid: string;
  organizationName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// export interface RegisterRequest {
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
//   phoneNumber: string;
//   organizationName?: string;
// }

// Login request type from the MCP client
export interface LoginRequest {
  email: string;
  password: string;
}

// Login response type fromt the Zelican URL
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  message: string;
}

// Authentication tokens types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// tokens decode payload data types
export interface TokenPayload {
  user_id: number;
  tenant_id: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Response from '/users/info' from the Zelican URL
export interface UserInfoResponse {
  id: string;
  email: string;
  fname: string;
  lname: string;
  permission: Array<{
    item_name: string;
  }>;
  tenant: {
    id: string;
    tenant_name: string;
  };
  phone: string;
  date_format: {
    id: string;
    date_format_value: string;
  };
  timezone: {
    id: string;
    timezone_value: string;
  };
  calendar_slot_duration: number;
  default_rate: string;
}

// Request types
export interface AuthenticatedRequest extends Request {
  userId?: String;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Chat related types
export interface Message extends Document {
  userId: string;
  content: string;
  role: "user" | "assistant" | "system" | "error";
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    [key: string]: any;
  };
}

export interface Conversation extends Document {
  userId: string;
  conversationId: String;
  title: string;
  messages: Message[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chat request types
export interface CreateConversationRequest {
  conversationId?:string,
  title?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  content: string;
  role?: "user" | "assistant" | "system" | "error";
  metadata?: {
    model?: string;
    tokens?: number;
    [key: string]: any;
  };
}

export interface UpdateConversationRequest {
  title?: string;
  isActive?: boolean;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// Environment types
export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  // MONGODB_TEST_URI: string;
  // JWT_SECRET: string;
  // JWT_REFRESH_SECRET: string;
  // JWT_EXPIRES_IN: string;
  // JWT_REFRESH_EXPIRES_IN: string;
  COOKIE_SECRET: string;
  // FRONTEND_URL: string;
}
