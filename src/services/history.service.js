import Interview from '../models/Interview.model.js';

export const getUserHistory = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [entries, totalEntries] = await Promise.all([
        Interview.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('role status overallScore totalQuestions createdAt'),

        Interview.countDocuments({ userId }),
    ]);

    return {
        entries,
        totalEntries,
        totalPages: Math.ceil(totalEntries / limit),
        currentPage: page,
    };
};

export const getHistoryEntry = async (entryId, userId) => {
    const entry = await Interview.findOne({ _id: entryId, userId }).select('-__v');
    if (!entry) throw new Error('Interview not found');
    return entry;
};

export const deleteHistoryEntry = async (entryId, userId) => {
    const entry = await Interview.findOneAndDelete({ _id: entryId, userId });
    if (!entry) throw new Error('Interview not found');
    return entry;
};

export const clearUserHistory = async (userId) => {
    const result = await Interview.deleteMany({ userId });
    return { deletedCount: result.deletedCount };
};