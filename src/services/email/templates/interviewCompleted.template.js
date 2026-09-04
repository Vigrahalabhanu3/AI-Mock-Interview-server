import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewCompletedEmail = ({
  candidateName,
  role,
  actualDuration = 25,
  resultUrl,
  platformName = 'MockAI Studio',
}) => {
  const subject = `Interview Completed – ${role}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
      Hi ${candidateName},
    </h2>
    <p style="margin-bottom: 16px;">
      Congratulations on completing your technical interview for <strong>${role}</strong>!
    </p>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Role:</span><span class="info-val">${role}</span></div>
      <div class="info-row"><span class="info-label">Interview Duration:</span><span class="info-val">${actualDuration} minutes</span></div>
      <div class="info-row"><span class="info-label">Status:</span><span class="info-val" style="color: #10b981;">Completed & Evaluated</span></div>
    </div>

    <p style="margin: 16px 0; font-size: 15px; color: #334155;">
      Your AI interview evaluation, scoring breakdown, and feedback report are now available for review.
    </p>

    <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
      Thank you for completing the interview.<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Your interview evaluation for ${role} is now ready to view`,
    content,
    callToAction: {
      label: 'View Interview Results',
      url: resultUrl,
    },
    platformName,
  });

  const text = `Hi ${candidateName},

Your interview for ${role} has been completed successfully.

Interview Duration:
${actualDuration} minutes

Your interview evaluation is now available:
${resultUrl}

Thank you for completing the interview.

${platformName} Team`;

  return { subject, html, text };
};
