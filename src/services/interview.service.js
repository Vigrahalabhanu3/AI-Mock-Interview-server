import Interview from '../models/Interview.model.js';
import User from '../models/User.model.js';
import emailService from './email/email.service.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import {
    GENERATE_QUESTIONS_PROMPT,
    INTERVIEW_GREETING_PROMPT,
    FOLLOW_UP_PROMPT,
    FEEDBACK_PROMPT,
    EVALUATE_CODE_PROMPT,
    buildConversationHistory,
} from '../constants/prompts.js';
import { resolveCandidateName } from '../utils/user.utils.js';

export const startInterview = async (userId, role, resumeText, candidateName, totalQuestions = 5) => {
    const candidate = await User.findById(userId);
    const resolvedCandidateName = resolveCandidateName(candidate || { name: candidateName });

    const questionsPrompt = GENERATE_QUESTIONS_PROMPT(role, resumeText, totalQuestions);
    const questionsResponse = await askGemini(questionsPrompt);
    const aiQuestions = parseGeminiJSON(questionsResponse);

    const introQuestion = {
        text: 'Tell me about yourself — your background, what you\'re currently working on, and what excites you about this role.',
        type: 'behavioral',
        isCodeQuestion: false,
    };
    const questions = [introQuestion, ...aiQuestions];

    const interview = await Interview.create({
        userId,
        role,
        resumeText,
        totalQuestions: questions.length,
        currentQuestion: 1,
        questions,
        status: 'in_progress',
    });

    const greetingPrompt = INTERVIEW_GREETING_PROMPT(role, resolvedCandidateName);
    const greeting = await askGemini(greetingPrompt);

    interview.messages.push({
        role: 'interviewer',
        content: greeting,
        timestamp: new Date(),
    });

    let audioBase64 = null;
    try {
        audioBase64 = await generateAudio(greeting);
    } catch (audioError) {
        console.error('Audio generation failed, continuing without audio:', audioError.message);
    }

    interview.lastAudio = audioBase64 || '';
    await interview.save();

    // Trigger confirmation / scheduled email non-blockingly
    User.findById(userId).then((candidate) => {
        if (candidate) {
            emailService.sendInterviewScheduled(interview, candidate).catch((err) => {
                console.error('[InterviewService] Scheduled email dispatch caught:', err.message);
            });
        }
    }).catch(() => {});

    return {
        interviewId: interview._id,
        greeting: greeting,
        currentQuestion: 1,
        totalQuestions: questions.length,
        question: introQuestion,
        audio: audioBase64,
    };
};

export const submitAnswer = async (interviewId, userId, answerText) => {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) throw new Error('Interview not found');
    if (interview.status === 'completed') throw new Error('Interview already completed');

    interview.messages.push({
        role: 'candidate',
        content: answerText,
        timestamp: new Date(),
    });

    const nextQuestionIndex = interview.currentQuestion;
    if (nextQuestionIndex >= interview.questions.length) {
        interview.status = 'completed';
        await interview.save();

        const farewellText = 'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report.';
        let farewellAudio = null;
        try {
            farewellAudio = await generateAudio(farewellText);
        } catch (audioError) {
            console.error('Farewell audio failed:', audioError.message);
        }

        return { isComplete: true, message: farewellText, audio: farewellAudio };
    }

    const conversationHistory = buildConversationHistory(interview.messages);
    const nextQuestion = interview.questions[nextQuestionIndex];

    const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, conversationHistory, nextQuestion.text);
    const followUpResponse = await askGemini(followUpPrompt);

    interview.messages.push({
        role: 'interviewer',
        content: followUpResponse,
        timestamp: new Date(),
    });

    interview.currentQuestion += 1;
    await interview.save();

    const spokenText = `${followUpResponse} ... ${nextQuestion.text}`;
    let audioBase64 = null;
    try {
        audioBase64 = await generateAudio(spokenText);
    } catch (audioError) {
        console.error('Audio generation failed, continuing without audio:', audioError.message);
    }

    interview.lastAudio = audioBase64 || '';
    await interview.save();

    return {
        isComplete: false,
        response: followUpResponse,
        currentQuestion: interview.currentQuestion,
        totalQuestions: interview.totalQuestions,
        question: nextQuestion,
        audio: audioBase64,
    };
};

export const submitCode = async (interviewId, userId, code, language) => {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
        const error = new Error('Interview not found');
        error.statusCode = 404;
        throw error;
    }
    if (interview.status === 'completed') {
        const error = new Error('Interview already completed');
        error.statusCode = 400;
        throw error;
    }

    const questionIndex = interview.currentQuestion - 1;
    const question = interview.questions[questionIndex];
    const codeType = question.codeType || 'write';

    const evalPrompt = EVALUATE_CODE_PROMPT(question.text, code, language, codeType);
    const evalResponse = await askGemini(evalPrompt);
    const evaluation = parseGeminiJSON(evalResponse);

    interview.codeSubmissions.push({
        questionIndex,
        codeType,
        code,
        language,
        evaluation,
        timestamp: new Date(),
    });

    interview.messages.push({
        role: 'candidate',
        content: `[Code ${codeType} in ${language}] Score: ${evaluation.score}/100\n${code}`,
        timestamp: new Date(),
    });

    const nextQuestionIndex = interview.currentQuestion;
    if (nextQuestionIndex >= interview.questions.length) {
        interview.status = 'completed';
        await interview.save();

        const farewellText = 'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report.';
        let farewellAudio = null;
        try {
            farewellAudio = await generateAudio(farewellText);
        } catch (audioError) {
            console.error('Farewell audio failed:', audioError.message);
        }

        return { evaluation, isComplete: true, audio: farewellAudio };
    }

    const conversationHistory = buildConversationHistory(interview.messages);
    const nextQuestion = interview.questions[nextQuestionIndex];

    const followUpPrompt = FOLLOW_UP_PROMPT(interview.role, conversationHistory, nextQuestion.text);
    const followUpResponse = await askGemini(followUpPrompt);

    interview.messages.push({
        role: 'interviewer',
        content: followUpResponse,
        timestamp: new Date(),
    });

    interview.currentQuestion += 1;

    const spokenText = `${followUpResponse} ... ${nextQuestion.text}`;
    let audioBase64 = null;
    try {
        audioBase64 = await generateAudio(spokenText);
    } catch (audioError) {
        console.error('Audio generation failed:', audioError.message);
    }

    interview.lastAudio = audioBase64 || '';
    await interview.save();

    return {
        evaluation,
        isComplete: false,
        response: followUpResponse,
        currentQuestion: interview.currentQuestion,
        totalQuestions: interview.totalQuestions,
        question: nextQuestion,
        audio: audioBase64,
    };
};

export const endInterview = async (interviewId, userId) => {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
        const error = new Error('Interview not found');
        error.statusCode = 404;
        throw error;
    }

    if (interview.status === 'completed' && interview.feedback) {
        return {
            interviewId: interview._id,
            feedback: interview.feedback,
            overallScore: interview.overallScore,
        };
    }

    const conversationHistory = buildConversationHistory(interview.messages);

    let codeSubmissionsSummary = '';
    if (interview.codeSubmissions.length > 0) {
        codeSubmissionsSummary = interview.codeSubmissions
            .map((sub, i) => `Submission ${i + 1} (${sub.language}):\n${sub.code}\nEvaluation: ${JSON.stringify(sub.evaluation)}`)
            .join('\n\n');
    }

    const feedbackPrompt = FEEDBACK_PROMPT(interview.role, conversationHistory, codeSubmissionsSummary);
    const feedbackResponse = await askGemini(feedbackPrompt);
    const feedback = parseGeminiJSON(feedbackResponse);

    interview.feedback = feedback;
    interview.overallScore = feedback.overallScore || 0;
    interview.status = 'completed';
    interview.emailStatus = {
        ...(interview.emailStatus || {}),
        completed: true,
        report: true,
    };
    await interview.save();

    // Trigger completion & report emails non-blockingly
    User.findById(userId).then((candidate) => {
        if (candidate) {
            emailService.sendInterviewCompleted(interview, candidate).catch((err) => {
                console.error('[InterviewService] Completed email dispatch error:', err.message);
            });
            emailService.sendInterviewReport(interview, candidate).catch((err) => {
                console.error('[InterviewService] Report email dispatch error:', err.message);
            });
        }
    }).catch(() => {});

    return {
        interviewId: interview._id,
        feedback,
        overallScore: feedback.overallScore,
    };
};

export const scheduleInterview = async (userId, { role, resumeText, scheduledAt, timezone, interviewType, duration }) => {
    if (!role) throw new Error('Interview role is required');
    if (!scheduledAt) throw new Error('Scheduled date and time are required');

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
        throw new Error('Invalid scheduled date format');
    }

    const candidate = await User.findById(userId);
    if (!candidate) throw new Error('Candidate not found');

    const interview = await Interview.create({
        userId,
        role,
        resumeText: resumeText || '',
        scheduledAt: scheduledDate,
        timezone: timezone || 'Asia/Kolkata',
        interviewType: interviewType || 'Technical & Behavioral Voice',
        duration: duration ? parseInt(duration, 10) : 30,
        status: 'scheduled',
    });

    // Trigger scheduled email non-blockingly
    emailService.sendInterviewScheduled(interview, candidate).catch((err) => {
        console.error('[InterviewService] Scheduled email error:', err.message);
    });

    return interview;
};

export const rescheduleInterview = async (interviewId, userId, { newScheduledAt, timezone }) => {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) throw new Error('Interview not found');
    if (interview.status === 'completed' || interview.status === 'cancelled') {
        throw new Error(`Cannot reschedule an interview with status: ${interview.status}`);
    }
    if (!newScheduledAt) throw new Error('New scheduled date and time are required');

    const candidate = await User.findById(userId);
    if (!candidate) throw new Error('Candidate not found');

    const previousScheduledAt = interview.scheduledAt;
    const newDate = new Date(newScheduledAt);
    if (isNaN(newDate.getTime())) {
        throw new Error('Invalid new scheduled date format');
    }

    interview.previousScheduledAt = previousScheduledAt;
    interview.scheduledAt = newDate;
    if (timezone) interview.timezone = timezone;
    interview.status = 'scheduled';
    await interview.save();

    emailService.sendInterviewRescheduled(interview, candidate, previousScheduledAt).catch((err) => {
        console.error('[InterviewService] Rescheduled email error:', err.message);
    });

    return interview;
};

export const cancelInterview = async (interviewId, userId, { cancellationReason }) => {
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) throw new Error('Interview not found');
    if (interview.status === 'completed') {
        throw new Error('Cannot cancel an interview that has already been completed');
    }

    const candidate = await User.findById(userId);
    if (!candidate) throw new Error('Candidate not found');

    interview.status = 'cancelled';
    interview.cancellationReason = cancellationReason || 'Candidate requested cancellation';
    await interview.save();

    emailService.sendInterviewCancelled(interview, candidate, interview.cancellationReason).catch((err) => {
        console.error('[InterviewService] Cancelled email error:', err.message);
    });

    return interview;
};

export const getInterviewById = async (interviewId, userId) => {
    const interview = await Interview.findOne({ _id: interviewId, userId }).select('-__v');
    if (!interview) {
        const error = new Error('Interview not found');
        error.statusCode = 404;
        throw error;
    }

    // 1. Lock Check for Scheduled Interviews:
    // The interview room remains LOCKED until 5 minutes before the scheduled start time.
    if (interview.status === 'scheduled' && interview.scheduledAt) {
        const now = new Date();
        const scheduledTime = new Date(interview.scheduledAt);
        // Room unlocks 5 minutes before scheduled start time
        const unlockTime = new Date(scheduledTime.getTime() - 5 * 60 * 1000);

        if (now < unlockTime) {
            return {
                _id: interview._id,
                role: interview.role,
                status: 'scheduled',
                isLocked: true,
                scheduledAt: interview.scheduledAt,
                unlockTime: unlockTime.toISOString(),
                serverTime: now.toISOString(),
                minutesUntilUnlock: Math.ceil((unlockTime.getTime() - now.getTime()) / (60 * 1000)),
                secondsUntilUnlock: Math.max(0, Math.ceil((unlockTime.getTime() - now.getTime()) / 1000)),
                timezone: interview.timezone,
                duration: interview.duration,
                interviewType: interview.interviewType,
                totalQuestions: interview.totalQuestions || 5,
            };
        }

        // 2. Unlocked (Within 5 minutes of start time or after):
        // Automatically generate AI questions and greeting if not yet initialized
        if (!interview.questions || interview.questions.length === 0) {
            const candidate = await User.findById(userId);
            const candidateName = resolveCandidateName(candidate);
            const totalQuestions = interview.totalQuestions || 5;

            try {
                const questionsPrompt = GENERATE_QUESTIONS_PROMPT(interview.role, interview.resumeText || '', totalQuestions);
                const questionsResponse = await askGemini(questionsPrompt);
                const aiQuestions = parseGeminiJSON(questionsResponse);

                const introQuestion = {
                    text: "Tell me about yourself — your background, what you're currently working on, and what excites you about this role.",
                    type: 'behavioral',
                    isCodeQuestion: false,
                };
                interview.questions = [introQuestion, ...aiQuestions];
                interview.totalQuestions = interview.questions.length;
                interview.currentQuestion = 1;
            } catch (qErr) {
                console.error('[InterviewService] Question generation error on unlock:', qErr.message);
                interview.questions = [
                    {
                        text: "Tell me about yourself — your background, what you're currently working on, and what excites you about this role.",
                        type: 'behavioral',
                        isCodeQuestion: false,
                    },
                    {
                        text: `What are the core technical principles and system designs you rely on in your work as a ${interview.role}?`,
                        type: 'technical',
                        isCodeQuestion: false,
                    }
                ];
                interview.totalQuestions = interview.questions.length;
                interview.currentQuestion = 1;
            }

            // Generate greeting and audio
            const greetingPrompt = INTERVIEW_GREETING_PROMPT(interview.role, candidateName);
            let greeting = `Hello ${candidateName}! I'm Natalie, your AI evaluator for today's ${interview.role} interview. Let's begin with the first question.`;
            try {
                greeting = await askGemini(greetingPrompt);
            } catch (gErr) {
                console.warn('[InterviewService] Greeting generation note:', gErr.message);
            }

            interview.messages = [{
                role: 'interviewer',
                content: greeting,
                timestamp: new Date(),
            }];

            try {
                const audioBase64 = await generateAudio(greeting);
                interview.lastAudio = audioBase64 || '';
            } catch (audioErr) {
                console.warn('[InterviewService] Audio generation note on unlock:', audioErr.message);
            }

            interview.status = 'in_progress';
            await interview.save();
        } else if (interview.status === 'scheduled') {
            interview.status = 'in_progress';
            await interview.save();
        }
    }

    return interview;
};