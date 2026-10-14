export interface IDemoUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee' | 'intern';
  department: string;
  phoneNumber: string;
  avatar: string;
  status: string;
}

export const DEMO_USERS: IDemoUser[] = [
  {
    _id: '6acf2b5c9f72db1bd90a50a6',
    name: 'Dr. Akhil Thapar',
    email: 'akhil.admin@thapar.edu',
    password: 'Password@123',
    role: 'admin',
    department: 'Admin',
    phoneNumber: '9876543210',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=akhil',
    status: 'active',
  },
  {
    _id: '6acf2b5c9f72db1bd90a50a7',
    name: 'Rohan Verma',
    email: 'rohan.employee@thapar.edu',
    password: 'Password@123',
    role: 'employee',
    department: 'Computer Science',
    phoneNumber: '9876543211',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=rohan',
    status: 'active',
  },
  {
    _id: '6acf2b5c9f72db1bd90a50a8',
    name: 'Ananya Goel',
    email: 'ananya.intern@thapar.edu',
    password: 'Password@123',
    role: 'intern',
    department: 'Biotechnology',
    phoneNumber: '9876543212',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ananya',
    status: 'active',
  },
];

export const DEMO_DEPARTMENTS = [
  { _id: 'dept1', name: 'Computer Science', description: 'Computer Science & Engineering Department' },
  { _id: 'dept2', name: 'Electronics', description: 'Electronics & Communication Engineering Department' },
  { _id: 'dept3', name: 'Mechanical', description: 'Mechanical Engineering Department' },
  { _id: 'dept4', name: 'Biotechnology', description: 'Biotechnology Department' },
  { _id: 'dept5', name: 'Management', description: 'School of Management' },
  { _id: 'dept6', name: 'Admin', description: 'Administrative Operations' },
  { _id: 'dept7', name: 'Other', description: 'General Operations' },
];

const now = new Date();
export const DEMO_TASKS = [
  {
    _id: 'task101',
    title: 'Verify Computer Science Curriculum Syllabi',
    description: 'Double check the ACM curriculum mapping for core courses (Operating Systems, Database Management Systems, Data Structures & Algorithms) to ensure compliance with NAAC guidelines.',
    deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    department: 'Computer Science',
    assignedTo: DEMO_USERS[1],
    createdBy: DEMO_USERS[0],
    status: 'pending',
    createdAt: now.toISOString(),
  },
  {
    _id: 'task102',
    title: 'Setup Biotechnology Lab Spectrometers',
    description: 'Align spectrometer calibration sheets for the graduate lab, complete verification checkmarks, and compile the log reports.',
    deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    department: 'Biotechnology',
    assignedTo: DEMO_USERS[2],
    createdBy: DEMO_USERS[0],
    status: 'in-progress',
    createdAt: now.toISOString(),
  },
  {
    _id: 'task103',
    title: 'Audit Electronics Project Equipment Invoices',
    description: 'Cross-reference financial statements from purchasing department with existing components inventory logs.',
    deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    department: 'Electronics',
    assignedTo: DEMO_USERS[1],
    createdBy: DEMO_USERS[0],
    status: 'in-progress',
    createdAt: now.toISOString(),
  },
];
