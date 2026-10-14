import mongoose, { Schema, Document } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'work-submitted'
  | 'under-review'
  | 'approved'
  | 'changes-requested';

export interface IAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface ITask extends Document {
  title: string;
  description: string;
  deadline: Date;
  priority: TaskPriority;
  department: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: TaskStatus;
  attachments: IAttachment[];
  editPermissionGranted: boolean; // Temporarily allows employee to edit description/details if extension is approved
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number },
});

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline date and time are required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    department: {
      type: String,
      required: [true, 'Department/Category is required'],
      default: 'Other',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'in-progress',
        'completed',
        'work-submitted',
        'under-review',
        'approved',
        'changes-requested',
      ],
      default: 'pending',
    },
    attachments: [AttachmentSchema],
    editPermissionGranted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching and filtering
TaskSchema.index({ title: 'text', description: 'text' });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ department: 1 });
TaskSchema.index({ deadline: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
