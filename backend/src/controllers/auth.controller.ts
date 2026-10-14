import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { generateTokens } from '../middleware/auth';
import { env } from '../config/env';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';

// Enforce thapar.edu domain check for email
const isValidThaparEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@thapar.edu');
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { name, email, password, role, department, phoneNumber } = req.body;

    if (!name || !email || !password || !role || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Name, email, password, phone number, and role are required' });
    }

    if (!isValidThaparEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Access is restricted exclusively to official @thapar.edu domains.',
      });
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Please enter a valid 10-digit mobile number.',
      });
    }

    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Registration as Administrator is not permitted. Administrators are predefined in the system.',
      });
    }

    // Check if user already exists (by email or phone)
    const userExists = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phoneNumber: phoneNumber }
      ]
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email.toLowerCase() 
          ? 'A user with this email already exists' 
          : 'A user with this mobile number already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Pre-save hook hashes this
      role,
      department: department || 'Computer Science',
      phoneNumber,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      status: 'active',
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit(req, 'register', `User ${user.email} registered account (Phone: ${user.phoneNumber}, Role: ${user.role})`);

    return res.status(251).json({
      success: true,
      message: 'Registration successful',
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logger.error('Error in register controller:', error);
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Thapar email or mobile number, and password are required' });
    }

    // Find user matching either email or phone number
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phoneNumber: identifier }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email/phone number and password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email/phone number and password.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit(req, 'login', `User ${user.email} logged in successfully`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logger.error('Error in login controller:', error);
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email or mobile number is required' });
    }

    // Find the user to check if they exist
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phoneNumber: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with that email or mobile number.' });
    }

    await logAudit(req, 'forgot_password_inquiry', `Password reset inquiry for user: ${user.email}`);

    // Return administrator contact details directly
    return res.status(200).json({
      success: true,
      message: 'To reset your password, please contact the System Administrator (Dr. Akhil Thapar) at +91 9876543210 or email akhil.admin@thapar.edu.',
    });
  } catch (error) {
    logger.error('Error in forgotPassword controller:', error);
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    let rToken = '';

    if (req.cookies && req.cookies.refresh_token) {
      rToken = req.cookies.refresh_token;
    } else if (req.body.refresh_token) {
      rToken = req.body.refresh_token;
    }

    if (!rToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is missing' });
    }

    try {
      const decoded = jwt.verify(rToken, env.JWT_REFRESH_SECRET) as any;
      const user = await User.findById(decoded.userId);

      if (!user || user.status === 'suspended') {
        return res.status(401).json({ success: false, message: 'Session invalid or user suspended' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        token: accessToken,
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
    }
  } catch (error) {
    logger.error('Error in refresh token controller:', error);
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (req.user) {
      await logAudit(req, 'logout', `User ${req.user.email} logged out`);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Error in logout controller:', error);
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        phoneNumber: req.user.phoneNumber,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
