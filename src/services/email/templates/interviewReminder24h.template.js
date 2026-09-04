import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewReminder24hEmail = ({
  candidateName,
  role,
  date,
  time,
  timezone,
  duration = 30,
  interviewUrl,
  platformName = 'MockAI Studio',
}) => {
  const subject = `Interview Reminder – Tomorrow`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
      Hi ${candidateName},
    </h2>
    <p style="margin-bottom: 16px;">
      This is a quick reminder that your technical mock interview for <strong>${role}</strong> is coming up tomorrow!
    </p>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Role:</span><span class="info-val">${role}</span></div>
      <div class="info-row"><span class="info-label">Date:</span><span class="info-val">${date}</span></div>
      <div class="info-row"><span class="info-label">Time:</span><span class="info-val">${time} ${timezone}</span></div>
      <div class="info-row"><span class="info-label">Duration:</span><span class="info-val">${duration} minutes</span></div>
    </div>

    <p style="margin: 16px 0; font-size: 14px; color: #475569;">
      <strong>Checklist:</strong> Make sure you have a working microphone and a stable internet connection for the interactive voice rounds.
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
      Good luck with your final preparation!<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Friendly reminder: Your ${role} interview is scheduled for tomorrow at ${time} ${timezone}`,
    content,
    callToAction: {
      label: 'Open Interview Room',
      url: interviewUrl,
    },
    platformName,
  });

  const text = `Hi ${candidateName},

This is a reminder that your mock interview is scheduled for tomorrow.

Role: ${role}
Date: ${date}
Time: ${time} ${timezone}
Duration: ${duration} minutes

Interview Link:
${interviewUrl}

${platformName} Team`;

  return { subject, html, text };
};
