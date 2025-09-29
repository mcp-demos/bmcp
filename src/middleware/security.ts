import cors from "cors";

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true); // Allow localhost and private network access
    const allowedOrigins = [
      "http://localhost:5001", // Frontend on port 5001
      "http://127.0.0.1:5001", // Frontend on port 5001
      "http://192.168.10.235:5001", // Frontend on private network IP
      "http://localhost:5173", // Vite dev server on port 5173
      "http://127.0.0.1:5173", // Vite dev server on port 5173
      "http://192.168.10.235:5173", // Vite dev server on private network IP
    ];

    // Check if origin is from private network
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin: ${origin}`); // CORS configuration applied
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
  ],
  // Note: Set-Cookie is controlled by browser and can't be exposed this way
  // exposedHeaders: ["Set-Cookie"],
};

// Security middleware setup - Rate limiting disabled
export const setupSecurity = () => {
  return [
    cors(corsOptions),
  ];
};
