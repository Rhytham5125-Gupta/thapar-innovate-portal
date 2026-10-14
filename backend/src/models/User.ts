import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'employee' | 'intern';
export type UserStatus = 'active' | 'suspended';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
  avatar?: string;
  status: UserStatus;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          return email.endsWith('@thapar.edu');
        },
        message: 'Access is restricted to official Thapar Institute accounts (@thapar.edu).',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'intern'],
      default: 'employee',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      default: 'Other',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Please enter a valid 10-digit mobile number (e.g. 9876543210).',
      },
    },
    avatar: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.matchPassword = async function (this: IUser, enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password || '');
};

// Search indexes
UserSchema.index({ name: 'text', email: 'text', phoneNumber: 'text' });

export default mongoose.model<IUser>('User', UserSchema);
