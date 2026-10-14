import { Request, Response, NextFunction } from 'express';

// Recursively strips mongo query operator keys (e.g. starting with $)
const sanitizeMongo = (obj: any): any => {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeMongo(obj[i]);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$')) {
        const sanitizedKey = key.replace(/^\$/, '');
        obj[sanitizedKey] = sanitizeMongo(obj[key]);
        delete obj[key];
      } else {
        obj[key] = sanitizeMongo(obj[key]);
      }
    }
  }
  return obj;
};

// Recursively strips HTML script tags and sanitizes strings to prevent XSS
const sanitizeXSS = (obj: any): any => {
  if (typeof obj === 'string') {
    // Remove script tags
    return obj
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, ''); // Simple tag stripping
  } else if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeXSS(obj[i]);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = sanitizeXSS(obj[key]);
    }
  }
  return obj;
};

export const securitySanitize = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeMongo(req.body);
    req.body = sanitizeXSS(req.body);
  }
  if (req.query) {
    req.query = sanitizeMongo(req.query);
    req.query = sanitizeXSS(req.query);
  }
  if (req.params) {
    req.params = sanitizeMongo(req.params);
    req.params = sanitizeXSS(req.params);
  }
  next();
};
