import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Resume from '../models/Resume.model.js';

export const parseResumePDF = async (pdfBuffer) => {
    try {
        const uint8Array = new Uint8Array(
            pdfBuffer.buffer,
            pdfBuffer.byteOffset,
            pdfBuffer.byteLength
        );

        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;

        let extractedText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const strings = content.items.map((item) => item.str);
            extractedText += strings.join(' ');
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF');
        }

        return extractedText;
    } catch (error) {
        console.error('PDF Parse Error:', error.message);
        throw new Error('Failed to parse PDF. Please upload a valid PDF file.');
    }
};

export const saveResume = async (userId, fileName, extractedText) => {
    const resume = await Resume.findOneAndUpdate(
        { userId },
        { userId, fileName, extractedText },
        { returnDocument: 'after', upsert: true }
    );

    return resume;
};

export const getUserResume = async (userId) => {
    const resume = await Resume.findOne({ userId }).select('-__v');
    return resume;
};