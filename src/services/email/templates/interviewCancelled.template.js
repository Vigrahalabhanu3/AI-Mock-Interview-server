import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewCancelledEmail = ({
  candidateName,
  role,
  originalDate,
  originalTime,
  timezone,
  reason = 'Candidate request or scheduling conflict',
  rescheduleUrl,
  platformName = 'MockAI Studio',
}) => {
  const subject = `Interview Cancelled – ${role}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
      Hi ${candidateName},
    </h2>
    <p style="margin-bottom: 16px;">
      Your interview for <strong>${role}</strong> has been cancelled.
    </p>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Role:</span><span class="info-val">${role}</span></div>
      ${
        originalDate
          ? `<div class="info-row"><span class="info-label">Original Time:</span><span class="info-val">${originalDate} at ${originalTime} ${timezone || ''}</span></div>`
          : ''
      }
      <div class="info-row"><span class="info-label">Reason:</span><span class="info-val" style="color: #ef4444;">${reason}</span></div>
    </div>

    <p style="margin: 16px 0; font-size: 14px; color: #475569;">
      Whenever you are ready to resume preparation, you can schedule a new interview session anytime.
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
      Warm regards,<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Your scheduled interview for ${role} has been cancelled`,
    content,
    callToAction: rescheduleUrl
      ? {
          label: 'Schedule New Interview',
          url: rescheduleUrl,
        }
      : null,
    platformName,
  });

  const text = `Hi ${candidateName},

Your interview for ${role} has been cancelled.

${originalDate ? `Original Date/Time: ${originalDate} at ${originalTime} ${timezone || ''}\n` : ''}Cancellation Reason: ${reason}

You can schedule a new session at:
${rescheduleUrl || 'https://mockai.studio/setup'}

${platformName} Team`;

  return { subject, html, text };
};
