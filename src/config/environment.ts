import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface Config {
  // Server Configuration
  PORT: number;
  NODE_ENV: string; 
  
  // Database Configuration
  MONGODB_URI: string;

  // JWT Configuration
  // JWT_SECRET: string;
  // JWT_REFRESH_SECRET: string;
  // JWT_EXPIRES_IN: string;
  // JWT_REFRESH_EXPIRES_IN: string;

  // Cookie Configuration
  COOKIE_SECRET: string; // CORS Configuration // FRONTEND_URL: string;
  ALLOWED_ORIGINS: string[];
  PRIVATE_NETWORK_IPS: string[];

  // Auth Service Configuration
  ZELICAN_URL: string;
}

const config: Config = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || "5003", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database Configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/zelican-mcp-chat",

  // JWT Configuration
  //   JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  //   JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production',
  //   JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  //   JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Cookie Configuration
  COOKIE_SECRET: process.env.COOKIE_SECRET || "",

  // CORS Configuration
  // FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5001',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:5001", "http://127.0.0.1:5001"],

  PRIVATE_NETWORK_IPS: process.env.PRIVATE_NETWORK_IPS
    ? process.env.PRIVATE_NETWORK_IPS.split(",").map((ip) => ip.trim())
    : ["192.168.10.235"],

  // Auth Service Configuration
  ZELICAN_URL: process.env.ZELICAN_URL || "http://pluto.zelican.net:9000/v2",
};

// Validate required environment variables
// const requiredEnvVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "COOKIE_SECRET"];
const requiredEnvVars = ["COOKIE_SECRET"];

if (config.NODE_ENV === "production") {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  });
}

export { config };