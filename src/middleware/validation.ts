import { body, param, query } from "express-validator";

// User validation rules
// export const validateRegister = [
//   body('firstName')
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('First name must be between 2 and 50 characters'),
//   body('lastName')
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('Last name must be between 2 and 50 characters'),
//   body('email')
//     .isEmail()
//     .normalizeEmail()
//     .withMessage('Please provide a valid email address'),
//   body('password')
//     .isLength({ min: 8 })
//     .withMessage('Password must be at least 8 characters long')
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?])/)
//     .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
//   body('confirmPassword')
//     .custom((value, { req }) => {
//       if (value !== req.body.password) {
//         throw new Error('Passwords do not match');
//       }
//       return true;
//     }),
//   body('address')
//     .trim()
//     .isLength({ min: 10, max: 500 })
//     .withMessage('Address must be between 10 and 500 characters'),
//   body('phoneNumber')
//     .matches(/^[6-9][0-9]{9}$/)
//     .withMessage('Please provide a valid 10-digit Indian phone number'),
//   body('organizationName')
//     .optional()
//     .trim()
//     .isLength({ max: 100 })
//     .withMessage('Organization name cannot exceed 100 characters')
// ];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// export const validateUpdateProfile = [
//   body('firstName')
//     .optional()
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('First name must be between 2 and 50 characters'),
//   body('lastName')
//     .optional()
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('Last name must be between 2 and 50 characters'),
//   body('address')
//     .optional()
//     .trim()
//     .isLength({ min: 10, max: 500 })
//     .withMessage('Address must be between 10 and 500 characters'),
//   body('phoneNumber')
//     .optional()
//     .matches(/^[6-9][0-9]{9}$/)
//     .withMessage('Please provide a valid 10-digit Indian phone number'),
//   body('organizationName')
//     .optional()
//     .trim()
//     .isLength({ max: 100 })
//     .withMessage('Organization name cannot exceed 100 characters')
// ];

// export const validateChangePassword = [
//   body('currentPassword')
//     .notEmpty()
//     .withMessage('Current password is required'),
//   body('newPassword')
//     .isLength({ min: 8 })
//     .withMessage('New password must be at least 8 characters long')
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?])/)
//     .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
//   body('confirmNewPassword')
//     .custom((value, { req }) => {
//       if (value !== req.body.newPassword) {
//         throw new Error('New passwords do not match');
//       }
//       return true;
//     })
// ];

// Chat validation rules

export const validateCreateConversation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("initialMessage")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Initial message must be between 1 and 10000 characters"),
];

export const validateSendMessage = [
  param("conversationId").isMongoId().withMessage("Invalid conversation ID"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Message content must be between 1 and 10000 characters"),
  body("role")
    .optional()
    .isIn(["user", "assistant", "system"])
    .withMessage("Role must be one of: user, assistant, system"),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),
  body("metadata.model")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Model name cannot exceed 100 characters"),
  body("metadata.tokens")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Tokens must be a non-negative integer"),
];

export const validateUpdateConversation = [
  param("conversationId").isMongoId().withMessage("Invalid conversation ID"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

export const validateConversationId = [
  param("conversationId").isMongoId().withMessage("Invalid conversation ID"),
];

export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export const validateSearch = [
  query("query")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be between 1 and 200 characters"),
  ...validatePagination,
];
