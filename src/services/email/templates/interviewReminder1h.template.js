import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewReminder1hEmail = ({
  candidateName,
  role,
  time,
  timezone,
  duration = 30,
  interviewUrl,
  platformName = 'MockAI Studio',
}) => {
  const subject = `Interview Starting Soon – ${role}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
      Hi ${candidateName},
    </h2>
    <p style="margin-bottom: 16px;">
      Your interview for <strong>${role}</strong> is starting in approximately <strong>1 hour</strong>!
    </p>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Role:</span><span class="info-val">${role}</span></div>
      <div class="info-row"><span class="info-label">Start Time:</span><span class="info-val" style="color: #06b6d4;">${time} ${timezone}</span></div>
      <div class="info-row"><span class="info-label">Duration:</span><span class="info-val">${duration} minutes</span></div>
    </div>

    <p style="margin: 16px 0; font-size: 14px; color: #475569;">
      Click below to join the room and test your audio visualizer before your evaluator begins:
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
      You've got this!<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Starting soon: Your ${role} interview begins in 1 hour at ${time}`,
    content,
    callToAction: {
      label: 'Join Interview Room Now',
      url: interviewUrl,
    },
    platformName,
  });

  const text = `Hi ${candidateName},

Your interview for ${role} is starting in 1 hour.

Time: ${time} ${timezone}
Duration: ${duration} minutes

Interview Link:
${interviewUrl}

${platformName} Team`;

  return { subject, html, text };
};
