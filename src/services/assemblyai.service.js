import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export const transcribeAudio = async (audioBuffer, originalName) => {
    const extension = path.extname(originalName) || '.webm';
    const tempPath = path.join(os.tmpdir(), `interview-audio-${Date.now()}${extension}`);

    try {
        fs.writeFileSync(tempPath, audioBuffer);

        const transcript = await client.transcripts.transcribe({
            audio: tempPath,
            speech_models: ['universal-2'],
        });

        if (transcript.status === 'error') {
            throw new Error(`Transcription failed: ${transcript.error}`);
        }

        return transcript.text || '[No speech detected in the recording]';
    } catch (error) {
        console.error('AssemblyAI Transcription Error:', error.message);
        throw new Error('Speech-to-text service is currently unavailable.');
    } finally {
        try {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        } catch (cleanupError) {
            console.error('Temp file cleanup error:', cleanupError.message);
        }
    }
};