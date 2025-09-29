import { Router } from "express";
import { ChatController } from "../controllers/chatControllers";
import { authenticate, getUserId } from "../middleware/auth";
import {
  validateCreateConversation,
  validateSendMessage,
  validateUpdateConversation,
  validateConversationId,
  validatePagination,
  validateSearch,
} from "../middleware/validation";

const router = Router();

// All chat routes require authentication
router.use(authenticate, getUserId);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */ router.get(
  "/conversations",
  validatePagination,
  ChatController.getConversations
);

/**
 * @route   POST /api/chat/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post(
  "/conversations",
  validateCreateConversation,
  ChatController.createConversation
);

/**
 * @route   GET /api/chat/conversations/search
 * @desc    Search conversations by title or content
 * @access  Private
 */
// router.get(
//   "/conversations/search",
//   validateSearch,
//   ChatController.searchConversations
// );

/**
 * @route   GET /api/chat/conversations/:conversationId
 * @desc    Get a specific conversation by ID
 * @access  Private
 */
router.get(
  "/conversations/:conversationId",
  validateConversationId,
  ChatController.getConversation
);

/**
 * @route   PUT /api/chat/conversations/:conversationId
 * @desc    Update a conversation (title, status, etc.)
 * @access  Private
 */
router.put(
  "/conversations/:conversationId",
  validateUpdateConversation,
  ChatController.updateConversation
);

/**
 * @route   DELETE /api/chat/conversations/:conversationId
 * @desc    Delete a conversation (soft delete)
 * @access  Private
 */
router.delete(
  "/conversations/:conversationId",
  validateConversationId,
  ChatController.deleteConversation
);

/**
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @desc    Get messages from a conversation with pagination
 * @access  Private
 */
router.get(
  "/conversations/:conversationId/messages",
  [...validateConversationId, ...validatePagination],
  ChatController.getMessages
);

/**
 * @route   GET /api/chat/conversations/:conversationId/messages/date-range
 * @desc    Get messages from a conversation within a specific date range
 * @access  Private
 */
// router.get(
//   "/conversations/:conversationId/messages/date-range",
//   [...validateConversationId, ...validatePagination],
//   ChatController.getMessagesByDateRange
// );

/**
 * @route   POST /api/chat/conversations/:conversationId/messages
 * @desc    Send a message to a conversation
 * @access  Private
 */
router.post(
  "/conversations/:conversationId/messages",
  validateSendMessage,
  ChatController.sendMessage
);

/**
 * @route   POST /api/chat/conversations/:conversationId/messages/batch
 * @desc    Store multiple messages in a conversation (for batch operations)
 * @access  Private
 */
// router.post(
//   "/conversations/:conversationId/messages/batch",
//   validateConversationId,
//   ChatController.storeMessages
// );

export default router;
