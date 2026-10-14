import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import User, { IUser } from '../models/User';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface ITokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateTokens = (user: IUser) => {
  const payload: ITokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    let token = '';

    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Or check cookies
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as ITokenPayload;

      // Get user from database
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account is suspended' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }
  } catch (error) {
    logger.error('Error in protect middleware:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during auth validation' });
  }
};
