import mongoose, { Schema, Model } from "mongoose";
import { Conversation } from "../types";

const conversationSchema = new Schema<Conversation>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    conversationId: {
        type: String,
        required: [true, "Conversation ID is required"]
    },
    title: {
      type: String,
      required: [true, "Conversation title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      default: "New Conversation",
    },
    messages: [
      {
        content: {
          type: String,
          required: [true, "Message content is required"],
          trim: true,
          minlength: [1, "Message content cannot be empty"],
        },
        role: {
          type: String,
          enum: ["user", "assistant", "system", "error"],
          required: [true, "Message role is required"],
          default: "user",
        },
        timestamp: {
          type: Date,
          default: Date.now,
          required: true,
        },
        metadata: {
          model: {
            type: String,
            trim: true,
          },
          tokens: {
            type: Number,
            min: 0,
          },
          // Allow for additional metadata fields
          type: Schema.Types.Mixed,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Indexes for better performance
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1 });
conversationSchema.index({ userId: 1, isDeleted: 1 });
conversationSchema.index({ userId: 1, isActive: 1, isDeleted: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ "messages.timestamp": -1 });

// Static method to find conversations by user
conversationSchema.statics.findByUserId = function (userId: number) {
  return this.find({ user_id: userId, isActive: true, isDeleted: false }).sort({
    updatedAt: -1,
  });
};

// Static method to find active conversations
conversationSchema.statics.findActiveConversations = function () {
  return this.find({ isActive: true, isDeleted: false }).sort({
    updatedAt: -1,
  });
};

// Instance method to add message
conversationSchema.methods.addMessage = function (messageData: {
  content: string;
  role: "user" | "assistant" | "system";
  metadata?: any;
}) {
  this.messages.push({
    ...messageData,
    timestamp: new Date(),
  });
  return this.save();
};

// Instance method to get last message
conversationSchema.methods.getLastMessage = function () {
  return this.messages[this.messages.length - 1];
};

// Instance method to get messages count
conversationSchema.methods.getMessageCount = function () {
  return this.messages.length;
};

// Instance method to soft delete conversation
conversationSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Pre-save middleware to update conversation title if it's the first message
// conversationSchema.pre("save", function (next) {
//   if (
//     this.isNew &&
//     this.messages.length > 0 &&
//     this.title === "New Conversation"
//   ) {
//     const firstMessage = this.messages[0];
//     if (firstMessage.role === "user") {
//       // Generate title from first user message (limit to 50 characters)
//       this.title = firstMessage.content.substring(0, 50).trim();
//       if (firstMessage.content.length > 50) {
//         this.title += "...";
//       }
//     }
//   }
//   next();
// });

// Create and export the model
const Conversation: Model<Conversation> = mongoose.model<Conversation>("Conversation", conversationSchema);

export default Conversation;