import Interview from '../models/Interview.model.js';
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

export const startInterview = async (userId, role, resumeText, candidateName, totalQuestions = 5) => {
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

    const greetingPrompt = INTERVIEW_GREETING_PROMPT(role, candidateName);
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
    await interview.save();

    return {
        interviewId: interview._id,
        feedback,
        overallScore: feedback.overallScore,
    };
};

export const getInterviewById = async (interviewId, userId) => {
    const interview = await Interview.findOne({ _id: interviewId, userId }).select('-__v');
    if (!interview) {
        const error = new Error('Interview not found');
        error.statusCode = 404;
        throw error;
    }
    return interview;
};