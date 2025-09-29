import mongoose from "mongoose";
import { config } from "./environment";

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      // if the database is already connected
      return;
    }

    try {
      const mongoUri = config.MONGODB_URI;

      await mongoose.connect(mongoUri);
      this.isConnected = true; // Connected to MongoDB successfully

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        // MongoDB disconnected
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        // MongoDB reconnected
        this.isConnected = true;
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false; // Disconnected from MongoDB
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const database = DatabaseConnection.getInstance();