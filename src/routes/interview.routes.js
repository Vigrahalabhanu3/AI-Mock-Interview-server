import { Router } from 'express';
import {
    startInterview,
    scheduleInterview,
    rescheduleInterview,
    cancelInterview,
    submitTextAnswer,
    submitVoiceAnswer,
    submitCode,
    endInterview,
    getInterview,
    transcribeOnly,
    speakText,
    getEmailLogs,
} from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { uploadAudio } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/start', startInterview);
router.post('/schedule', scheduleInterview);
router.patch('/:id/reschedule', rescheduleInterview);
router.patch('/:id/cancel', cancelInterview);
router.get('/:id/email-logs', getEmailLogs);

router.post('/transcribe', uploadAudio, transcribeOnly);
router.post('/:id/answer', submitTextAnswer);
router.post('/:id/answer-audio', uploadAudio, submitVoiceAnswer);
router.post('/:id/code', submitCode);
router.post('/:id/end', endInterview);
router.get('/:id', getInterview);
router.post('/:id/speak', speakText);

export default router;