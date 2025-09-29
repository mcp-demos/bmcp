import jwt from "jsonwebtoken";
import { Response } from "express";
import { config } from "../config/environment";
import { TokenPayload, AuthTokens } from "../types";

export class JWTUtils {
  /* Generate access token */
  static async generateAccessToken(
    refresh_token: string | null
  ): Promise<AuthTokens | null> {
    try {
      const response = await fetch(
        `${config.ZELICAN_URL}/authorization/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refresh_token }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate access token");
      }

      const data = (await response.json()) as AuthTokens;

      if (!data.access_token || !data.refresh_token) {
        return null; // or throw an error
      }

      // Assuming the API responds with { access_token: "..." }
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error("Error generating access token:", error);
      return null;
    }
  }

  /**
   * Verify access token
   */
  // static verifyAccessToken(token: string): TokenPayload {
  //   try {
  //     return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  //   } catch (error) {
  //     throw new Error('Invalid access token');
  //   }
  // }

  static decodeAccessToken(token: string): TokenPayload | null {
    try {
      // Decode without verifying the signature
      const payload = jwt.decode(token) as TokenPayload | null;
      if (!payload) {
        throw new Error("Invalid access token format");
      }
      return payload;
    } catch (error) {
      throw new Error("Unable to decode access token");
    }
  }

  /**
   * Verify refresh token
   */
  // static verifyRefreshToken(token: string): TokenPayload {
  //   try {
  //     return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  //   } catch (error) {
  //     throw new Error('Invalid refresh token');
  //   }
  // }

  /* Extract token from Authorization header */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    console.log("authHeader", authHeader);
    return authHeader.substring(7);
  }

  /* Set authentication cookies */
  static setAuthCookies(res: Response, tokens: AuthTokens): void {
    const cookieOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    // Set access token cookie (expires in 1 hour)
    res.cookie("accessToken", tokens.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });

    // Set refresh token cookie (expires in 7 days)
    res.cookie("refreshToken", tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }

  /* Clear authentication cookies */
  static clearAuthCookies(res: Response): void {
    const cookieOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
  }

  /* Get token expiration time */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /* Check if token is expired */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /* Refresh access token using refresh token */
  static async refreshAccessToken(
    refresh_token: string | null
  ): Promise<AuthTokens | null> {
    try {
      // Also need to check the expiry of the token and not just to decode it
      // const payload = this.decodeRefreshToken(refreshToken);
      return await this.generateAccessToken(refresh_token);
    } catch (error) {
      throw new Error("Unable to refresh access token");
    }
  }
}
