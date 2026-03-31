export const GENERATE_QUESTIONS_PROMPT = (role, resumeText, totalQuestions) => `
You are an expert technical interviewer conducting a ${role} interview.

Analyze the candidate's resume below and generate exactly ${totalQuestions - 1} interview questions.
The FIRST question "Tell me about yourself" is already added — do NOT include it.

RULES:
1. Generate a realistic interview flow like real-world interviews:
   - 1-2 behavioral questions (based on their experience, projects, and past roles from resume)
   - 1-2 technical knowledge questions (specific to the ${role} role)
   - 1 coding question (mark as code question)
2. Questions should be SHORT and CRISP (1-2 sentences maximum)
3. Reference specific skills, projects, or experience from the resume
4. Gradually increase difficulty
5. Make questions conversational — like a real interviewer would ask, not a quiz

CODING QUESTION RULES:
- For the coding question, randomly pick ONE of these formats:
  a) "write" — Ask the candidate to write a function/solution from scratch
  b) "fix" — Provide a buggy code snippet and ask them to find and fix the bug
  c) "explain" — Provide a code snippet and ask them to explain what it does and how it works
- Set the "codeType" field to "write", "fix", or "explain"
- For "fix" and "explain", include the code snippet in the "codeSnippet" field
- Specify the language based on the role

RESPONSE FORMAT:
Return ONLY a valid JSON array (no markdown, no code blocks, no extra text):
[
  {
    "text": "question text here",
    "type": "behavioral",
    "isCodeQuestion": false
  },
  {
    "text": "Write a function that reverses a linked list.",
    "type": "technical",
    "isCodeQuestion": true,
    "codeType": "write",
    "codeLanguage": "javascript"
  },
  {
    "text": "This function is supposed to filter even numbers but has a bug. Find and fix it.",
    "type": "technical",
    "isCodeQuestion": true,
    "codeType": "fix",
    "codeLanguage": "javascript",
    "codeSnippet": "function filterEvens(arr) {\\n  return arr.filter(n => n % 2 === 1);\\n}"
  },
  {
    "text": "Explain what this code does and what the output would be.",
    "type": "technical",
    "isCodeQuestion": true,
    "codeType": "explain",
    "codeLanguage": "javascript",
    "codeSnippet": "const result = [1,2,3].reduce((acc, n) => acc + n, 0);"
  }
]

CANDIDATE RESUME:
${resumeText}
`;

export const INTERVIEW_GREETING_PROMPT = (role, candidateName) => `
You are Natalie, a friendly and professional interviewer conducting a ${role} interview.

Generate a SHORT and WARM greeting for the candidate named ${candidateName}, like a real interview opening:
- Introduce yourself briefly (name and role)
- Mention the ${role} position they are interviewing for
- Make them feel comfortable: "Take your time, there are no wrong answers"
- End by saying: "Let's start with the basics — tell me about yourself."
- Keep it under 4 sentences total
- Be warm, professional, and encouraging — like a real human interviewer

Return ONLY the greeting text, no JSON, no markdown.
`;

export const FOLLOW_UP_PROMPT = (role, conversationHistory, nextQuestion) => `
You are Natalie, a friendly and conversational interviewer conducting a ${role} interview.

CONVERSATION SO FAR:
${conversationHistory}

IMPORTANT GUIDELINES:
1. ONLY acknowledge what the candidate ACTUALLY said in their previous answer (1-2 sentences max)
2. Reference their REAL response - do NOT make up what they said
3. End with a brief transition like "Let's move on to the next one." or "Here's the next question."
4. Do NOT repeat or include the next question text — it will be shown separately
5. Be warm, conversational, and CONCISE

Return ONLY your acknowledgment text, no JSON, no markdown. Do NOT include the next question.
`;

export const FEEDBACK_PROMPT = (role, conversationHistory, codeSubmissions) => `
You are an expert interview evaluator. Analyze this complete ${role} interview and provide detailed feedback.

COMPLETE INTERVIEW CONVERSATION:
${conversationHistory}

${codeSubmissions ? `CODE SUBMISSIONS:\n${codeSubmissions}` : ''}

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no code blocks, no extra text.
Address the candidate directly using "you" and "your".

Use this EXACT JSON structure:
{
  "overallScore": 75,
  "categoryScores": {
    "communicationSkills": {
      "score": 80,
      "comment": "Your communication was clear and well-structured..."
    },
    "technicalKnowledge": {
      "score": 70,
      "comment": "You demonstrated solid understanding of..."
    },
    "problemSolving": {
      "score": 75,
      "comment": "Your approach to problem-solving showed..."
    },
    "codeQuality": {
      "score": 65,
      "comment": "Your code submissions showed..."
    },
    "confidence": {
      "score": 80,
      "comment": "You appeared confident when..."
    }
  },
  "strengths": [
    "Specific strength 1 with example from their actual answers",
    "Specific strength 2 with example from their actual answers"
  ],
  "areasOfImprovement": [
    "Specific area 1 with constructive suggestion",
    "Specific area 2 with constructive suggestion"
  ],
  "finalAssessment": "A 2-3 sentence overall assessment of the candidate's performance."
}

Be specific - reference ACTUAL things they said during the interview.
Score each category between 0-100 based on their actual performance.
`;

export const EVALUATE_CODE_PROMPT = (question, code, language, codeType) => `
You are an expert code reviewer evaluating a candidate's solution during a technical interview.

QUESTION:
${question}

TASK TYPE: ${codeType || 'write'} (${codeType === 'fix' ? 'candidate was asked to fix a bug' : codeType === 'explain' ? 'candidate was asked to explain the code' : 'candidate was asked to write code from scratch'})

CANDIDATE'S RESPONSE (${language}):
${code}

Evaluate based on the task type:
- For "write": Check correctness, efficiency, and code quality
- For "fix": Check if the bug was correctly identified and fixed
- For "explain": Check if the explanation is accurate, clear, and covers key concepts

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "isCorrect": true,
  "score": 80,
  "feedback": "Brief evaluation based on the task type",
  "suggestions": "What could be improved"
}

Score between 0-100. Be constructive and specific.
`;

export const buildConversationHistory = (messages) => {
    if (!messages || messages.length === 0) return 'No conversation yet.';

    // Use the last 20 messages to keep within context limits
    const recentMessages = messages.slice(-20);

    return recentMessages
        .map((msg) => {
            const role = msg.role === 'interviewer' ? 'Interviewer' : 'Candidate';
            return `${role}: ${msg.content}`;
        })
        .join('\n\n');
};