import mongoose from 'mongoose';

const emailNotificationSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      index: true,
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    emailType: {
      type: String,
      enum: [
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_RESCHEDULED',
        'INTERVIEW_CANCELLED',
        'INTERVIEW_REMINDER_24H',
        'INTERVIEW_REMINDER_1H',
        'INTERVIEW_COMPLETED',
        'INTERVIEW_REPORT',
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    provider: {
      type: String,
      default: 'resend',
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    scheduledFor: {
      type: Date,
      index: true,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast lookups and duplicate prevention
emailNotificationSchema.index({ interviewId: 1, emailType: 1, status: 1 });
emailNotificationSchema.index({ status: 1, scheduledFor: 1 });
emailNotificationSchema.index({ createdAt: -1 });

const EmailNotification = mongoose.model(
  'EmailNotification',
  emailNotificationSchema
);

export default EmailNotification;
