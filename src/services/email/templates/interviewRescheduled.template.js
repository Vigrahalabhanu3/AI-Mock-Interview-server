import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewRescheduledEmail = ({
  candidateName,
  role,
  previousDate,
  previousTime,
  newDate,
  newTime,
  timezone,
  duration = 30,
  interviewUrl,
  platformName = 'MockAI Studio',
}) => {
  const subject = `Interview Rescheduled – ${role}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
      Hi ${candidateName},
    </h2>
    <p style="margin-bottom: 16px;">
      Your interview session for <strong>${role}</strong> has been rescheduled to a new time.
    </p>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Role:</span><span class="info-val">${role}</span></div>
      ${
        previousDate
          ? `<div class="info-row"><span class="info-label">Previous Time:</span><span class="info-val" style="color: #94a3b8; text-decoration: line-through;">${previousDate} at ${previousTime}</span></div>`
          : ''
      }
      <div class="info-row"><span class="info-label">New Date:</span><span class="info-val" style="color: #0891b2;">${newDate}</span></div>
      <div class="info-row"><span class="info-label">New Time:</span><span class="info-val" style="color: #0891b2;">${newTime} ${timezone}</span></div>
      <div class="info-row"><span class="info-label">Duration:</span><span class="info-val">${duration} minutes</span></div>
    </div>

    <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
      We look forward to seeing you then!<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Your interview for ${role} has been moved to ${newDate} at ${newTime}`,
    content,
    callToAction: {
      label: 'Access Rescheduled Session',
      url: interviewUrl,
    },
    platformName,
  });

  const text = `Hi ${candidateName},

Your interview has been rescheduled.

Role: ${role}
${previousDate ? `Previous Date/Time: ${previousDate} at ${previousTime}\n` : ''}New Date: ${newDate}
New Time: ${newTime} ${timezone}
Duration: ${duration} minutes

Interview Link:
${interviewUrl}

${platformName} Team`;

  return { subject, html, text };
};
