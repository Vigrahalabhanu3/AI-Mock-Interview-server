import * as interviewService from '../services/interview.service.js';
import { transcribeAudio } from '../services/assemblyai.service.js';
import { streamAudio } from '../services/murf.service.js';

export const startInterview = async (req, res, next) => {
    try {
        const { role, resumeText, totalQuestions } = req.body;

        if (!role) {
            return res.status(400).json({ success: false, message: 'Please select a role for the interview.' });
        }
        if (!resumeText) {
            return res.status(400).json({ success: false, message: 'Please upload your resume first.' });
        }

        const result = await interviewService.startInterview(
            req.user._id,
            role,
            resumeText,
            req.user.name,
            totalQuestions || 5
        );

        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const submitTextAnswer = async (req, res, next) => {
    try {
        const { answer } = req.body;

        if (!answer || answer.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please provide an answer.' });
        }

        const result = await interviewService.submitAnswer(
            req.params.id,
            req.user._id,
            answer
        );

        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const submitVoiceAnswer = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No audio file received.' });
        }

        const transcribedText = await transcribeAudio(
            req.file.buffer,
            req.file.originalname || 'answer.webm'
        );

        const result = await interviewService.submitAnswer(
            req.params.id,
            req.user._id,
            transcribedText
        );

        return res.json({
            success: true,
            data: {
                ...result,
                transcribedText,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const submitCode = async (req, res, next) => {
    try {
        const { code, language } = req.body;

        if (!code || code.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please write some code before submitting.' });
        }

        const evaluation = await interviewService.submitCode(
            req.params.id,
            req.user._id,
            code,
            language || 'javascript'
        );

        return res.json({ success: true, data: evaluation });
    } catch (error) {
        next(error);
    }
};

export const endInterview = async (req, res, next) => {
    try {
        const result = await interviewService.endInterview(
            req.params.id,
            req.user._id
        );

        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getInterview = async (req, res, next) => {
    try {
        const interview = await interviewService.getInterviewById(
            req.params.id,
            req.user._id
        );

        return res.json({ success: true, data: interview });
    } catch (error) {
        next(error);
    }
};

export const transcribeOnly = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No audio file received.' });
        }

        const text = await transcribeAudio(
            req.file.buffer,
            req.file.originalname || 'answer.webm'
        );

        return res.json({ success: true, data: { text } });
    } catch (error) {
        next(error);
    }
};

export const speakText = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'No text provided for speech.' });
        }

        await streamAudio(text, res);
    } catch (error) {
        next(error);
    }
};