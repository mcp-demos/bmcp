import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { JWTUtils } from "../utils/jwt";
import {
  ApiResponse,
  AuthenticatedRequest,
  LoginRequest,
  LoginResponse,
  UserInfoResponse,
  UserResponse,
} from "../types";
import { config } from "../config/environment";

export class AuthController {
  // Configuration for the external auth service
  // private static readonly ZELICAN_URL = config.ZELICAN_URL || '';

  /* User login proxy */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          message: "Validation failed",
          errors: errors.array().map((error) => ({
            field: error.type === "field" ? error.path : "unknown",
            message: error.msg,
          })),
        };
        res.status(400).json(response);
        return;
      }

      // Forward login request to external auth service
      const { email, password }: LoginRequest = req.body;

      const loginResponse = await fetch(
        `${config.ZELICAN_URL}/authorization/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email, password: password }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!loginResponse.ok) {
        const response: ApiResponse = {
          success: false,
          message:
            loginResponse.status === 401
              ? "Invalid credentials"
              : "Login failed",
        };
        res.status(loginResponse.status).json(response);
        return;
      }

      const loginData = (await loginResponse.json()) as LoginResponse;
      const { access_token, refresh_token } = loginData;

      // Fetch detailed user profile using access token
      const userProfileResponse = await fetch(
        `${config.ZELICAN_URL}/users/info`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!userProfileResponse.ok) {
        const response: ApiResponse = {
          success: false,
          message: "Failed to fetch user profile",
        };
        res.status(userProfileResponse.status).json(response);
        return;
      }

      const userProfile =
        (await userProfileResponse.json()) as UserInfoResponse;

      // User info data
      const userResponse: UserResponse = {
        userUuid: userProfile?.id,
        firstName: userProfile?.fname,
        lastName: userProfile?.lname,
        email: userProfile?.email,
        phoneNumber: userProfile?.phone,
        organizationUuid: userProfile?.tenant?.id || "",
        organizationName: userProfile?.tenant?.tenant_name || "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Prepare tokens in your format
      const tokens = {
        access_token: access_token,
        refresh_token: refresh_token,
      };

      // Set cookies with the received tokens
      JWTUtils.setAuthCookies(res, tokens);

      // Response send on login
      const response: ApiResponse<{
        user: UserResponse;
        tokens: typeof tokens;
      }> = {
        success: true,
        message: "Login successful",
        data: {
          user: userResponse,
          tokens,
        },
      };
      res.json(response);
    } catch (error: any) {
      console.error("Login proxy error:", error);

      if (error.name === "AbortError") {
        const response: ApiResponse = {
          success: false,
          message: "Request timeout",
        };
        res.status(408).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          message: "External service unavailable",
        };
        res.status(503).json(response);
      }
    }
  }

  /* User logout proxy */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get access token from cookies or headers
      const accessToken =
        req.cookies?.accessToken ||
        req.headers.authorization?.replace("Bearer ", "");
      const refreshToken =
        req.cookies?.refreshToken ||
        req.headers.authorization?.replace("Bearer ", "");

      if (refreshToken) {
        // Forward logout request to external service
        try {
          const logoutResponse = await fetch(
            `${config.ZELICAN_URL}/authorization/logout`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
              signal: AbortSignal.timeout(5000),
            }
          );
          // Log but don't fail the logout process if external service fails
          if (!logoutResponse.ok) {
            console.error("External logout failed:", logoutResponse.status);
          }
        } catch (logoutError) {
          console.error("External logout error:", logoutError);
        }
      }

      // Clear authentication cookies
      JWTUtils.clearAuthCookies(res);

      const response: ApiResponse = {
        success: true,
        message: "Logout successful",
      };
      res.json(response);
    } catch (error: any) {
      console.error("Logout proxy error:", error);

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Get current user profile proxy */
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Get access token from cookies or headers
      const accessToken =
        req.cookies?.accessToken ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      // Fetch user profile from external service
      const userProfileResponse = await fetch(
        `${config.ZELICAN_URL}/users/info`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!userProfileResponse.ok) {
        const response: ApiResponse = {
          success: false,
          message:
            userProfileResponse.status === 401
              ? "User not authenticated"
              : "Failed to fetch profile",
        };
        res.status(userProfileResponse.status).json(response);
        return;
      }

      const userProfile =
        (await userProfileResponse.json()) as UserInfoResponse;

      // Transform to your format
      const userResponse: UserResponse = {
        userUuid: userProfile.id,
        firstName: userProfile.fname,
        lastName: userProfile?.lname,
        email: userProfile?.email,
        phoneNumber: userProfile?.phone,
        organizationUuid: userProfile?.tenant?.id || "",
        organizationName: userProfile?.tenant?.tenant_name || "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response: ApiResponse<{ user: UserResponse }> = {
        success: true,
        message: "Profile retrieved successfully",
        data: { user: userResponse },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Get profile proxy error:", error);

      if (error.name === "AbortError") {
        const response: ApiResponse = {
          success: false,
          message: "Request timeout",
        };
        res.status(408).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          message: "External service unavailable",
        };
        res.status(503).json(response);
      }
    }
  }

  /* Check authentication status proxy */
  static async checkAuth(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const accessToken =
        req.cookies?.accessToken ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        const response: ApiResponse = {
          success: false,
          message: "Not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      // Verify token with external service
      const userProfileResponse = await fetch(
        `${config.ZELICAN_URL}/users/info`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!userProfileResponse.ok) {
        const response: ApiResponse = {
          success: false,
          message: "Not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const userProfile =
        (await userProfileResponse.json()) as UserInfoResponse;

      // Transform to your format
      const userResponse: UserResponse = {
        userUuid: userProfile?.id,
        firstName: userProfile?.fname,
        lastName: userProfile?.lname,
        email: userProfile?.email,
        phoneNumber: userProfile?.phone,
        organizationUuid: userProfile?.tenant?.id || "",
        organizationName: userProfile?.tenant?.tenant_name || "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response: ApiResponse<{ user: UserResponse }> = {
        success: true,
        message: "User is authenticated",
        data: { user: userResponse },
      };
      res.json(response);
    } catch (error: any) {
      console.error("Check auth proxy error:", error);

      const response: ApiResponse = {
        success: false,
        message: "Not authenticated",
      };
      res.status(401).json(response);
    }
  }
}
