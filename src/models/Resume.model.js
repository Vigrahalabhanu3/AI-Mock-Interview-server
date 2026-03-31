import mongoose from 'mongoose';
const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        extractedText: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;