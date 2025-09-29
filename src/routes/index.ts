import { Router } from "express";
import authRoutes from "./auth";
import chatRoutes from "./chat";
import apiKeysRoutes from "./apiKeys";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "MCP Chat Backend API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/api-keys", apiKeysRoutes);

// 404 handler for API routes
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

export default router;