import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Conversation from "../models/Conversation";
import {
  ApiResponse,
  AuthenticatedRequest,
  CreateConversationRequest,
  Message,
  SendMessageRequest,
  UpdateConversationRequest,
} from "../types";
import { v4 as uuidv4 } from "uuid";

interface MyQuery {
  search?: string;
  page?: string;
}


export class ChatController {
  /* Get all conversations for the authenticated user */
  static async getConversations(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Get conversations with pagination
      const conversations = await Conversation.find({
        userId: req,
        isActive: true,
        isDeleted: false,
      })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const total = await Conversation.countDocuments({
        userId: req?.userId,
        isActive: true,
        isDeleted: false,
      });

      const response: ApiResponse<{
        conversations: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }> = {
        success: true,
        message: "Conversations retrieved successfully",
        data: {
          conversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Get conversations error:", error);

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Get a specific conversation by ID */
  static async getConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { conversationId } = req.params;

      const conversation = await Conversation.findOne({
        conversationId: conversationId,
        userId: req.userId,
        isActive: true,
        isDeleted: false,
      }).lean();

      if (!conversation) {
        const response: ApiResponse = {
          success: false,
          message: "Conversation not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        message: "Conversation retrieved successfully",
        data: conversation,
      };
      res.json(response);
    } catch (error: any) {
      console.error("Get conversation error:", error);

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Create a new conversation */
  static async createConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

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

      const { title, initialMessage }: CreateConversationRequest = req.body;

      // Create conversation data
      const conversationData: any = {
        conversationId: uuidv4(),
        userId: req.userId,
        title: title || "New Conversation",
        messages: [],
      };

      // Add initial message if provided
      if (initialMessage) {
        conversationData.messages.push({
          content: initialMessage,
          role: "user",
          timestamp: new Date(),
        } as any);
      }

      const conversation = new Conversation(conversationData);
      await conversation.save();

      const response: ApiResponse<any> = {
        success: true,
        message: "Conversation created successfully",
        data: conversation.toJSON(),
      };
      res.status(201).json(response);
    } catch (error: any) {
      console.error("Create conversation error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => ({
            field: err.path,
            message: err.message,
          })
        );

        const response: ApiResponse = {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Send a message to a conversation */
  static async sendMessage(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

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

      const { conversationId } = req.params;
      const { content, role = "user", metadata }: SendMessageRequest = req.body;

      // Find the conversation
      const conversation = await Conversation.findOne({
        conversationId: conversationId,
        userId: req.userId,
        isActive: true,
        isDeleted: false,
      });

      if (!conversation) {
        const response: ApiResponse = {
          success: false,
          message: "Conversation not found",
        };
        res.status(404).json(response);
        return;
      }

      // Add the message
      const newMessage = {
        content,
        role,
        timestamp: new Date(),
        metadata: metadata || {},
      };

      conversation.messages.push(newMessage as any);
      await conversation.save();

      const response: ApiResponse<any> = {
        success: true,
        message: "Message sent successfully",
        data: {
          conversation: conversation.toJSON(),
          message: newMessage,
        },
      };
      res.json(response);
    } catch (error: any) {
      console.error("Send message error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => ({
            field: err.path,
            message: err.message,
          })
        );

        const response: ApiResponse = {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Store multiple messages in a conversation (for batch operations) */
  //   static async storeMessages(
  //     req: AuthenticatedRequest,
  //     res: Response
  //   ): Promise<void> {
  //     try {
  //       if (!req.userId) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "User not authenticated",
  //         };
  //         res.status(401).json(response);
  //         return;
  //       }

  //       const { conversationId } = req.params;
  //       const { messages } = req.body;

  //       if (!messages || !Array.isArray(messages) || messages.length === 0) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "Messages array is required and must not be empty",
  //         };
  //         res.status(400).json(response);
  //         return;
  //       }

  //       // Find the conversation
  //       const conversation = await Conversation.findOne({
  //         conversationId: conversationId,
  //         userId: req.userId,
  //         isActive: true,
  //         isDeleted: false,
  //       });

  //       if (!conversation) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "Conversation not found",
  //         };
  //         res.status(404).json(response);
  //         return;
  //       }

  //       // Validate and format messages
  //       const formattedMessages = messages.map((msg: any) => ({
  //         content: msg.content,
  //         role: msg.role || "user",
  //         timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
  //         metadata: msg.metadata || {},
  //       }));

  //       // Add messages to conversation
  //       formattedMessages.forEach((msg) => {
  //         conversation.messages.push(msg as any);
  //       });

  //       conversation.updatedAt = new Date();
  //       await conversation.save();

  //       const response: ApiResponse<any> = {
  //         success: true,
  //         message: "Messages stored successfully",
  //         data: {
  //           messagesStored: formattedMessages.length,
  //           conversation: conversation.toJSON(),
  //         },
  //       };
  //       res.json(response);
  //     } catch (error: any) {
  //       console.error("Store messages error:", error);

  //       const response: ApiResponse = {
  //         success: false,
  //         message: "Internal server error",
  //       };
  //       res.status(500).json(response);
  //     }
  //   }

  /* Update a conversation (title, status, etc.) */
  static async updateConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

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

      const { conversationId } = req.params;
      const { title, isActive }: UpdateConversationRequest = req.body;

      // Build update object
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (isActive !== undefined) updateData.isActive = isActive;

      const conversation = await Conversation.findOneAndUpdate(
        {
          conversationId: conversationId,
          userId: req.userId,
          isDeleted: false,
        },
        updateData,
        { new: true, runValidators: true }
      );

      if (!conversation) {
        const response: ApiResponse = {
          success: false,
          message: "Conversation not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        message: "Conversation updated successfully",
        data: conversation.toJSON(),
      };

      res.json(response);
    } catch (error: any) {
      console.error("Update conversation error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => ({
            field: err.path,
            message: err.message,
          })
        );

        const response: ApiResponse = {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Delete a conversation (soft delete) */
  static async deleteConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { conversationId } = req.params;

      const conversation = await Conversation.findOneAndUpdate(
        {
          conversationId: conversationId,
          userId: req.userId,
          isDeleted: false,
        },
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
        { new: true }
      );

      if (!conversation) {
        const response: ApiResponse = {
          success: false,
          message: "Conversation not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Conversation deleted successfully",
      };
      res.json(response);
    } catch (error: any) {
      console.error("Delete conversation error:", error);

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Get messages from a conversation with pagination */
  static async getMessages(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        const response: ApiResponse = {
          success: false,
          message: "User not authenticated",
        };
        res.status(401).json(response);
        return;
      }

      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversation = await Conversation.findOne({
        conversationId: conversationId,
        userId: req.userId,
        isActive: true,
        isDeleted: false,
      }).lean();

      if (!conversation) {
        const response: ApiResponse = {
          success: false,
          message: "Conversation not found",
        };
        res.status(404).json(response);
        return;
      }

      // Calculate pagination for messages
      const totalMessages = conversation.messages.length;
      const startIndex = Math.max(0, totalMessages - page * limit);
      const endIndex = totalMessages - (page - 1) * limit;
      const messages = conversation.messages.slice(startIndex, endIndex);

      const response: ApiResponse<{
        messages: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }> = {
        success: true,
        message: "Messages retrieved successfully",
        data: {
          messages,
          pagination: {
            page,
            limit,
            total: totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
          },
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Get messages error:", error);

      const response: ApiResponse = {
        success: false,
        message: "Internal server error",
      };
      res.status(500).json(response);
    }
  }

  /* Search conversations by title or content */
  //   static async searchConversations(
  //     req: AuthenticatedRequest,
  //     res: Response
  //   ): Promise<void> {
  //     try {
  //       if (!req.userId) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "User not authenticated",
  //         };
  //         res.status(401).json(response);
  //         return;
  //       }

  //       const { query } = req.query as { query: string };
  //       const page = parseInt(req.query.page as string) || 1;
  //       const limit = parseInt(req.query.limit as string) || 20;
  //       const skip = (page - 1) * limit;

  //       if (!query || query.trim().length === 0) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "Search query is required",
  //         };
  //         res.status(400).json(response);
  //         return;
  //       }

  //       // Search in conversation titles and message content
  //       const searchRegex = new RegExp(query.trim(), "i");
  //       const conversations = await Conversation.find({
  //         userId: req.userId,
  //         isActive: true,
  //         isDeleted: false,
  //         $or: [{ title: searchRegex }, { "messages.content": searchRegex }],
  //       })
  //         .sort({ updatedAt: -1 })
  //         .skip(skip)
  //         .limit(limit)
  //         .lean();

  //       const total = await Conversation.countDocuments({
  //         userId: req.userId,
  //         isActive: true,
  //         isDeleted: false,
  //         $or: [{ title: searchRegex }, { "messages.content": searchRegex }],
  //       });

  //       const response: ApiResponse<{
  //         conversations: any[];
  //         pagination: {
  //           page: number;
  //           limit: number;
  //           total: number;
  //           totalPages: number;
  //         };
  //         query: string;
  //       }> = {
  //         success: true,
  //         message: "Search completed successfully",
  //         data: {
  //           conversations,
  //           pagination: {
  //             page,
  //             limit,
  //             total,
  //             totalPages: Math.ceil(total / limit),
  //           },
  //           query,
  //         },
  //       };

  //       res.json(response);
  //     } catch (error: any) {
  //       console.error("Search conversations error:", error);

  //       const response: ApiResponse = {
  //         success: false,
  //         message: "Internal server error",
  //       };
  //       res.status(500).json(response);
  //     }
  //   }

  /* Get messages from a conversation within a specific date range */
  //   static async getMessagesByDateRange(
  //     req: AuthenticatedRequest,
  //     res: Response
  //   ): Promise<void> {
  //     try {
  //       if (!req.userId) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "User not authenticated",
  //         };
  //         res.status(401).json(response);
  //         return;
  //       }

  //       const { conversationId } = req.params;
  //       const { startDate, endDate } = req.query as {
  //         startDate?: string;
  //         endDate?: string;
  //       };
  //       const page = parseInt(req.query.page as string) || 1;
  //       const limit = parseInt(req.query.limit as string) || 50; // Validate date parameters

  //       let startDateObj: Date | undefined;
  //       let endDateObj: Date | undefined;

  //       if (startDate) {
  //         startDateObj = new Date(startDate);
  //         if (isNaN(startDateObj.getTime())) {
  //           const response: ApiResponse = {
  //             success: false,
  //             message: "Invalid start date format",
  //           };
  //           res.status(400).json(response);
  //           return;
  //         }
  //       }

  //       if (endDate) {
  //         endDateObj = new Date(endDate);
  //         if (isNaN(endDateObj.getTime())) {
  //           const response: ApiResponse = {
  //             success: false,
  //             message: "Invalid end date format",
  //           };
  //           res.status(400).json(response);
  //           return;
  //         }
  //       }

  //       const conversation = await Conversation.findOne({
  //         conversationId: conversationId,
  //         userId: req.userId,
  //         isActive: true,
  //         isDeleted: false,
  //       }).lean();

  //       if (!conversation) {
  //         const response: ApiResponse = {
  //           success: false,
  //           message: "Conversation not found",
  //         };
  //         res.status(404).json(response);
  //         return;
  //       }

  //       // Filter messages by date range
  //       let filteredMessages = conversation.messages;

  //       if (startDateObj || endDateObj) {
  //         filteredMessages = conversation.messages.filter((message) => {
  //           const messageDate = new Date(message.timestamp);
  //           if (startDateObj && messageDate < startDateObj) {
  //             return false;
  //           }
  //           if (endDateObj && messageDate > endDateObj) {
  //             return false;
  //           }
  //           return true;
  //         });
  //       }

  //       // Apply pagination
  //       const totalMessages = filteredMessages.length;
  //       const startIndex = (page - 1) * limit;
  //       const endIndex = startIndex + limit;
  //       const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

  //       // Group messages by date
  //       const messageGroups: { [key: string]: any[] } = {};
  //       paginatedMessages.forEach((message) => {
  //         const messageDate = new Date(message.timestamp);
  //         const dateKey = messageDate.toISOString().split("T")[0];

  //         // YYYY-MM-DD format
  //         if (!messageGroups[dateKey]) {
  //           messageGroups[dateKey] = [];
  //         }
  //         messageGroups[dateKey].push(message);
  //       });

  //       const response: ApiResponse<{
  //         messages: any[];
  //         messageGroups: { [key: string]: any[] };
  //         pagination: {
  //           page: number;
  //           limit: number;
  //           total: number;
  //           totalPages: number;
  //         };
  //         dateRange: {
  //           startDate?: string;
  //           endDate?: string;
  //         };
  //       }> = {
  //         success: true,
  //         message: "Messages retrieved successfully",
  //         data: {
  //           messages: paginatedMessages,
  //           messageGroups,
  //           pagination: {
  //             page,
  //             limit,
  //             total: totalMessages,
  //             totalPages: Math.ceil(totalMessages / limit),
  //           },
  //           dateRange: {
  //             startDate: startDate,
  //             endDate: endDate,
  //           },
  //         },
  //       };

  //       res.json(response);
  //     } catch (error: any) {
  //       console.error("Get messages by date range error:", error);

  //       const response: ApiResponse = {
  //         success: false,
  //         message: "Internal server error",
  //       };
  //       res.status(500).json(response);
  //     }
  //   }
}
