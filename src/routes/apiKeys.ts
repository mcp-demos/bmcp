import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

// Get API keys from environment variables
router.get("/keys", (req: Request, res: Response) => {
  try {
    // Get API keys from environment variables
    const apiKeys = {
      groq: process.env.GROQ_API_KEY || null,
      anthropic: process.env.ANTHROPIC_API_KEY || null,
      openai: process.env.OPENAI_API_KEY || null,
    };

    // Only return non-null keys
    const availableKeys = Object.entries(apiKeys)
      .filter(([_, value]) => value !== null)
      .reduce((acc, [key, value]) => {
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

    res.json({
      success: true,
      data: availableKeys,
      message: "API keys retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving API keys:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve API keys",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

// Get specific API key by provider
router.get("/keys/:provider", (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    let apiKey: string | null = null;
    switch (provider.toLowerCase()) {
      case "groq":
        apiKey = process.env.GROQ_API_KEY || null;
        break;
      case "anthropic":
        apiKey = process.env.ANTHROPIC_API_KEY || null;
        break;
      case "openai":
        apiKey = process.env.OPENAI_API_KEY || null;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported provider: ${provider}`,
        });
    }

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: `API key not found for provider: ${provider}`,
      });
    }

    return res.json({
      success: true,
      data: {
        provider,
        apiKey,
      },
      message: `API key retrieved for ${provider}`,
    });
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve API key",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

export default router;
