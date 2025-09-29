import { Request, Response, NextFunction } from "express";
import { JWTUtils } from "../utils/jwt";
import { AuthenticatedRequest, ApiResponse, UserInfoResponse, UserResponse } from "../types";
import { config } from "../config/environment";

// Helper to extract token (same as before)
const extractTokenFromRequest = (req: Request): string | null => {
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
};

/* Authentication middleware that verifies JWT tokens from cookies or Authorization header */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: "Access token not provided",
      };
      res.status(401).json(response);
      return;
    }

    // Decode the token
    // Here it should be the verification of the token, instead of decoding the token
    // const payload = JWTUtils.verifyAccessToken(token);
    const payload = JWTUtils.decodeAccessToken(token);

    if (!payload?.user_id) {
      const response: ApiResponse = {
        success: false,
        message: "User not found or inactive",
      };
      res.status(401).json(response);
      return;
    }

    // Find the user
    // const user = await User.findById(payload?.user_id);

    // const user = {
    //   userId: payload?.user_id,
    //   isActive: true,
    // };

    // Assume frontend sends user data in headers or body (adjust as needed)
    const userData = req.headers["x-user-data"]
      ? JSON.parse(req.headers["x-user-data"] as string)
      : null;

    // Cross-check token user ID with frontend user data user ID
    if (!userData) {
      const response: ApiResponse = {
        success: false,
        message: "User not found or inactive",
      };
      res.status(401).json(response);
      return;
    }

    // if (!user || !user.isActive) {
    //   const response: ApiResponse = {
    //     success: false,
    //     message: "User not found or inactive",
    //   };
    //   res.status(401).json(response);
    //   return;
    // }
    // Attach user to request
    // req.user = user;

    // req.userId = userData.userUuid;

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Invalid or expired token",
    };
    res.status(401).json(response);
  }
};


export const getUserId = async(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

      req.userId = userResponse.userUuid;
      
      next()
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

/* Middleware to refresh access token using refresh token */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let refresh_token: string | null = null;

    // Try to get refresh token from cookies first (most secure)
    if (req.cookies?.refresh_token) {
      refresh_token = req.cookies.refresh_token;
    }
    // Fallback to Authorization header for API clients
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      refresh_token = req.headers.authorization.substring(7);
    }
    // Fallback to request body for API clients
    else if (req.body?.refresh_token) {
      refresh_token = req.body.refresh_token;
    }

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token not provided",
        error: "MISSING_REFRESH_TOKEN",
      });
      return;
    }

    // Validate and generate new tokens
    const tokens = await JWTUtils.refreshAccessToken(refresh_token);

    if (!tokens) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
        error: "INVALID_REFRESH_TOKEN",
      });
      return;
    }

    // Set new tokens in cookies (secure storage)
    JWTUtils.setAuthCookies(res, tokens);

    const response: ApiResponse = {
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Token refresh error:", error);

    // Clear potentially invalid cookies
    JWTUtils.clearAuthCookies(res);

    res.status(401).json({
      success: false,
      message: "Failed to refresh token",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "TOKEN_REFRESH_FAILED",
    });
  }
};
