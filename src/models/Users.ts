// import mongoose, { Schema, Model } from 'mongoose';
// // import bcrypt from 'bcryptjs';
// import { User } from '../types';
// // import { config } from '../config/environment';

// const userSchema = new Schema<User>({
//   firstName: {
//     type: String,
//     required: [true, 'First name is required'],
//     trim: true,
//     minlength: [2, 'First name must be at least 2 characters long'],
//     maxlength: [50, 'First name cannot exceed 50 characters']
//   },
//   lastName: {
//     type: String,
//     required: [true, 'Last name is required'],
//     trim: true,
//     minlength: [2, 'Last name must be at least 2 characters long'],
//     maxlength: [50, 'Last name cannot exceed 50 characters']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     trim: true,
//     lowercase: true,
//     match: [
//       /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//       'Please provide a valid email address'
//     ]
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [8, 'Password must be at least 8 characters long'],
//     select: false // Don't include password in queries by default
//   },
//   phoneNumber: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     match: [
//       /^[6-9][0-9]{9}$/,
//       'Please provide a valid 10-digit Indian phone number'
//     ]
//   },
//   organizationName: {
//     type: String,
//     trim: true,
//     maxlength: [100, 'Organization name cannot exceed 100 characters']
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, {
//   timestamps: true,
//   toJSON: {
//     transform: function(doc, ret) {
//       const { password, __v, ...cleanRet } = ret;
//       return cleanRet;
//     }
//   },
//   toObject: {
//     transform: function(doc, ret) {
//       const { password, __v, ...cleanRet } = ret;
//       return cleanRet;
//     }
//   }
// });

// // Indexes for better performance
// // Note: email index is already created by unique: true, so no need to add it again
// userSchema.index({ createdAt: -1 });
// userSchema.index({ isActive: 1 });

// // Pre-save middleware to hash password
// // userSchema.pre('save', async function(next) {
// //   // Only hash the password if it has been modified (or is new)
// //   if (!this.isModified('password')) return next();

// //   try {
// //     // Hash password with configured salt rounds
// //     const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
// //     this.password = await bcrypt.hash(this.password, salt);
// //     next();
// //   } catch (error) {
// //     next(error as Error);
// //   }
// // });

// // Instance method to compare password
// // userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
// //   try {
// //     return await bcrypt.compare(candidatePassword, this.password);
// //   } catch (error) {
// //     throw new Error('Password comparison failed');
// //   }
// // };

// // Static method to find user by email with password
// userSchema.statics.findByEmailWithPassword = function(email: string) {
//   return this.findOne({ email, isActive: true }).select('+password');
// };

// // Static method to find active users
// userSchema.statics.findActiveUsers = function() {
//   return this.find({ isActive: true });
// };

// // Virtual for full name
// userSchema.virtual('fullName').get(function() {
//   return `${this.firstName} ${this.lastName}`;
// });

// // Ensure virtual fields are serialized
// userSchema.set('toJSON', { virtuals: true });
// userSchema.set('toObject', { virtuals: true });

// // Create and export the model
// const User: Model<User> = mongoose.model<User>('User', userSchema);

// export default User;