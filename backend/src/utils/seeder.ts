import User from '../models/User';
import Task from '../models/Task';
import Department from '../models/Department';
import { logger } from './logger';

export const seedDatabase = async (): Promise<void> => {
  try {
    // 1. Seed Departments
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const depts = [
        { name: 'Computer Science', description: 'Computer Science & Engineering Department' },
        { name: 'Electronics', description: 'Electronics & Communication Engineering Department' },
        { name: 'Mechanical', description: 'Mechanical Engineering Department' },
        { name: 'Biotechnology', description: 'Biotechnology Department' },
        { name: 'Management', description: 'School of Management' },
        { name: 'Admin', description: 'Administrative Operations' },
        { name: 'Other', description: 'General Operations' },
      ];
      await Department.insertMany(depts);
      logger.info('Default departments seeded.');
    }

    // 2. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const usersData = [
        {
          name: 'Dr. Akhil Thapar',
          email: 'akhil.admin@thapar.edu',
          password: 'Password@123', // Will be hashed via pre-save hook
          role: 'admin' as const,
          department: 'Admin',
          phoneNumber: '9876543210',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=akhil',
          status: 'active' as const,
        },
        {
          name: 'Rohan Verma',
          email: 'rohan.employee@thapar.edu',
          password: 'Password@123',
          role: 'employee' as const,
          department: 'Computer Science',
          phoneNumber: '9876543211',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=rohan',
          status: 'active' as const,
        },
        {
          name: 'Ananya Goel',
          email: 'ananya.intern@thapar.edu',
          password: 'Password@123',
          role: 'intern' as const,
          department: 'Biotechnology',
          phoneNumber: '9876543212',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ananya',
          status: 'active' as const,
        },
      ];

      // Using User.create to ensure the pre-save hook for password hashing runs successfully
      const createdUsers = await User.create(usersData);
      logger.info('Test personas seeded with default passwords & phone numbers.');

      // 3. Seed Tasks linked to seeded users
      const admin = createdUsers.find((u) => u.role === 'admin');
      const employee = createdUsers.find((u) => u.role === 'employee');
      const intern = createdUsers.find((u) => u.role === 'intern');

      if (admin && employee && intern) {
        const now = new Date();
        const tasksData = [
          {
            title: 'Verify Computer Science Curriculum Syllabi',
            description: 'Double check the ACM curriculum mapping for core courses (Operating Systems, Database Management Systems, Data Structures & Algorithms) to ensure compliance with NAAC guidelines.',
            deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            priority: 'high' as const,
            department: 'Computer Science',
            assignedTo: employee._id,
            createdBy: admin._id,
            status: 'pending' as const,
          },
          {
            title: 'Setup Biotechnology Lab Spectrometers',
            description: 'Align spectrometer calibration sheets for the graduate lab, complete verification checkmarks, and compile the log reports.',
            deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
            priority: 'medium' as const,
            department: 'Biotechnology',
            assignedTo: intern._id,
            createdBy: admin._id,
            status: 'in-progress' as const,
          },
          {
            title: 'Audit Electronics Project Equipment Invoices',
            description: 'Cross-reference financial statements from purchasing department with existing components inventory logs.',
            deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Overdue: 2 days ago
            priority: 'high' as const,
            department: 'Electronics',
            assignedTo: employee._id,
            createdBy: admin._id,
            status: 'in-progress' as const, // In progress but deadline in past = Overdue
          },
          {
            title: 'Design Innovation Portal Mockups',
            description: 'Create Figma designs for the new student incubation program, outlining submission flows and feedback drawers.',
            deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Ended yesterday
            priority: 'low' as const,
            department: 'Computer Science',
            assignedTo: employee._id,
            createdBy: admin._id,
            status: 'approved' as const, // Closed successfully
          },
        ];

        await Task.insertMany(tasksData);
        logger.info('Sample tasks seeded.');
      }
    }
  } catch (error) {
    logger.error('Failed to seed database:', error);
  }
};
