const MURF_BASE_URL = 'https://global.api.murf.ai/v1/speech/stream';
const MURF_VOICE_ID = 'en-US-natalie';
const MURF_LOCALE = 'en-US';

export const streamAudio = async (text, res) => {
    try {
        const payload = {
            text: text,
            voiceId: MURF_VOICE_ID,
            model: 'FALCON',
            multiNativeLocale: MURF_LOCALE,
            sampleRate: 24000,
            format: 'MP3',
        };

        const headers = {
            'Content-Type': 'application/json',
            'api-key': process.env.MURF_API_KEY,
        };

        const response = await fetch(MURF_BASE_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Murf API Error:', errorText);
            throw new Error(`Murf API failed with status ${response.status}`);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const base64Chunk = Buffer.from(value).toString('base64');
            res.write(base64Chunk + '\n');
        }

        res.end();
    } catch (error) {
        console.error('Murf Service Error:', error.message);
        if (res.headersSent) {
            res.end();
            return;
        }
        throw new Error('Voice generation service is currently unavailable.');
    }
};

export const generateAudio = async (text) => {
    try {
        const payload = {
            text: `[pause 1s] ${text}`,
            voiceId: MURF_VOICE_ID,
            model: 'FALCON',
            multiNativeLocale: MURF_LOCALE,
            sampleRate: 24000,
            format: 'MP3',
        };

        const headers = {
            'Content-Type': 'application/json',
            'api-key': process.env.MURF_API_KEY,
        };

        const response = await fetch(MURF_BASE_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Murf API Error:', errorText);
            throw new Error(`Murf API failed with status ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        return base64Audio;
    } catch (error) {
        console.error('Murf Generate Audio Error:', error.message);
        throw new Error('Voice generation service is currently unavailable.');
    }
};