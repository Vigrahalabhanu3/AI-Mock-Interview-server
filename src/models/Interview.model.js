import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        role: {
            type: String,
            required: true,
        },
        resumeText: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
            default: 'in_progress',
            index: true,
        },
        scheduledAt: {
            type: Date,
            default: null,
            index: true,
        },
        previousScheduledAt: {
            type: Date,
            default: null,
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata',
        },
        interviewType: {
            type: String,
            default: 'Technical & Behavioral Voice',
        },
        duration: {
            type: Number,
            default: 30, // in minutes
        },
        cancellationReason: {
            type: String,
            default: '',
        },
        totalQuestions: {
            type: Number,
            default: 5,
        },
        currentQuestion: {
            type: Number,
            default: 0,
        },
        questions: {
            type: Array,
            default: [],
        },
        messages: {
            type: Array,
            default: [],
        },
        codeSubmissions: {
            type: Array,
            default: [],
        },
        lastAudio: {
            type: String,
            default: '',
        },
        feedback: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        overallScore: {
            type: Number,
            default: null,
        },
        emailStatus: {
            type: mongoose.Schema.Types.Mixed,
            default: {
                scheduled: false,
                reminder24h: false,
                reminder1h: false,
                completed: false,
                report: false,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
interviewSchema.index({ status: 1, scheduledAt: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;