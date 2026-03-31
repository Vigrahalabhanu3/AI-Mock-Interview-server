export const parseGeminiJSON = (text) => {
    try {
        let cleanText = text.trim();

        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '');
            cleanText = cleanText.replace(/\n?```\s*$/, '');
        }

        return JSON.parse(cleanText.trim());
    } catch (error) {
        console.error('Failed to parse Gemini JSON response:', error.message);
        console.error('Raw text was:', text);
        throw new Error('Failed to parse AI response. The AI returned an unexpected format.');
    }
};