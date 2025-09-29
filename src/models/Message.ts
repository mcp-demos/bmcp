import mongoose, { Schema, Model } from "mongoose";
import { Message } from "../types";

const messageSchema = new Schema<Message>(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      minlength: [1, "Message content cannot be empty"],
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
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
messageSchema.index({ timestamp: -1 });
messageSchema.index({ role: 1 });

// Create and export the model
const Message: Model<Message> = mongoose.model<Message>("Message", messageSchema);

export default Message;