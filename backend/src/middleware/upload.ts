import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const uploadDir = path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`Upload directory created at: ${uploadDir}`);
  }
} catch (error) {
  logger.error('Error creating upload directory:', error);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure file upload criteria
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file limit
  },
  fileFilter: (req, file, cb) => {
    // Accepting all standard formats defined in requirements
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.jpg', '.jpeg', '.png', '.zip', '.csv', '.txt',
      '.c', '.cpp', '.py', '.java', '.js', '.ts', '.tsx', '.html', '.css'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Extension ${ext} not supported. Allowed formats include PDF, Word, Excel, PPT, Zip, Images, and code source files.`));
    }
  },
});
