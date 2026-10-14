import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Department from '../models/Department';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';
import { DEMO_DEPARTMENTS } from '../utils/demoData';

export const getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: DEMO_DEPARTMENTS.length,
        departments: DEMO_DEPARTMENTS,
      });
    }

    let departments = await Department.find().sort({ name: 1 });

    // Seed default departments if none exist
    if (departments.length === 0) {
      const defaults = [
        { name: 'Computer Science', description: 'Computer Science & Engineering Department' },
        { name: 'Electronics', description: 'Electronics & Communication Engineering Department' },
        { name: 'Mechanical', description: 'Mechanical Engineering Department' },
        { name: 'Biotechnology', description: 'Biotechnology Department' },
        { name: 'Management', description: 'School of Management' },
        { name: 'Admin', description: 'Administrative Operations' },
        { name: 'Other', description: 'General Operations' },
      ];
      await Department.insertMany(defaults);
      departments = await Department.find().sort({ name: 1 });
      logger.info('Default departments seeded successfully.');
    }

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    logger.error('Error in getDepartments controller:', error);
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const exists = await Department.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const department = await Department.create({
      name: name.trim(),
      description: description || '',
    });

    await logAudit(req, 'create_department', `Created department: ${department.name}`);

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    logger.error('Error in createDepartment controller:', error);
    next(error);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Prevent deleting 'Other' department
    if (department.name === 'Other') {
      return res.status(400).json({ success: false, message: 'Cannot delete the fallback department (Other)' });
    }

    await Department.findByIdAndDelete(req.params.id);
    await logAudit(req, 'delete_department', `Deleted department: ${department.name}`);

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteDepartment controller:', error);
    next(error);
  }
};
