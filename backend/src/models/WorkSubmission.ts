import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface IWorkSubmission extends Document {
  taskId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  notes: string;
  files: ISubmissionFile[];
  status: 'under-review' | 'approved' | 'changes-requested';
  reviewComments?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionFileSchema = new Schema<ISubmissionFile>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
});

const WorkSubmissionSchema = new Schema<IWorkSubmission>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    files: [SubmissionFileSchema],
    status: {
      type: String,
      enum: ['under-review', 'approved', 'changes-requested'],
      default: 'under-review',
    },
    reviewComments: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

WorkSubmissionSchema.index({ taskId: 1 });
WorkSubmissionSchema.index({ submittedBy: 1 });

export default mongoose.model<IWorkSubmission>('WorkSubmission', WorkSubmissionSchema);
