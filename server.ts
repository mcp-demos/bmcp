import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config/environment"
import { database } from "./config/database";
import { setupSecurity } from "./middleware/security"; // authRateLimit removed - rate limiting disabled
import {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
} from "./middleware/errorHandler";
import routes from "./routes";

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Trust proxy for accurate IP addresses
    this.app.set("trust proxy", 1);

    // Security middleware
    const securityMiddleware = setupSecurity();
    securityMiddleware.forEach((middleware) => {
      this.app.use(middleware);
    });

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Cookie parser
    this.app.use(cookieParser(config.COOKIE_SECRET));

    // Logging middleware
    if (config.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Health check endpoint (before rate limiting)
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "MCP Chat Backend API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
      });
    });
  }

  private initializeRoutes(): void {
    // Auth rate limiting disabled - no IP restrictions
    // this.app.use('/api/auth/login', authRateLimit);
    // this.app.use('/api/auth/register', authRateLimit);
    // this.app.use('/api/auth/refresh', authRateLimit);

    // API routes
    this.app.use("/api", routes);

    // 404 handler for all other routes
    this.app.use("*", notFoundHandler);
  }

  private initializeErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  private async connectDatabase(): Promise<void> {
    try {
      await database.connect();
      // Database connection established
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Connect to database first
      await this.connectDatabase();

      // Start server - listen on all network interfaces for private network access
      const server = this.app.listen(this.port, "0.0.0.0", () => {
        console.log(`🚀 Server running on port ${this.port}`);
        // Server started successfully on port ${this.port}
      });

      // Graceful shutdown
      const gracefulShutdown = (signal: string) => {
        // Received shutdown signal, starting graceful shutdown

        server.close(async () => {
          // HTTP server closed

          try {
            await database.disconnect();
            // Database connection closed and graceful shutdown completed
            process.exit(0);
          } catch (error) {
            console.error("❌ Error during shutdown:", error);
            process.exit(1);
          }
        });

        // Force close after 30 seconds
        setTimeout(() => {
          console.error(
            "⏰ Could not close connections in time, forcefully shutting down"
          );
          process.exit(1);
        }, 30000);
      };

      // Handle shutdown signals
      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start server
const server = new Server();

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  server.start().catch((error) => {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  });
}

export default server;
