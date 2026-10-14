import mongoose, { Schema, Document } from 'mongoose';

export interface IExtensionRequest extends Document {
  taskId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  requestedDeadline: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExtensionRequestSchema = new Schema<IExtensionRequest>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedDeadline: {
      type: Date,
      required: [true, 'Requested deadline date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for extension is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comments: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ExtensionRequestSchema.index({ taskId: 1 });
ExtensionRequestSchema.index({ requestedBy: 1 });
ExtensionRequestSchema.index({ status: 1 });

export default mongoose.model<IExtensionRequest>('ExtensionRequest', ExtensionRequestSchema);
