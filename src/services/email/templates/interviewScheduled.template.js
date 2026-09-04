import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewScheduledEmail = ({
  candidateName,
  role,
  interviewType = 'Technical & Behavioral Voice',
  date,
  time,
  timezone,
  duration = 30,
  interviewUrl,
  platformName = 'MockAI Studio',
  instructions = 'Please join a few minutes before the scheduled time in a quiet environment with your microphone ready.',
}) => {
  const subject = `Interview Scheduled – ${role}`;

  const content = `
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
      Hi ${candidateName},
    </h2>
    <p style="margin-bottom: 16px;">
      Your technical interview has been successfully scheduled. Here are the details of your upcoming session:
    </p>

    <div class="info-card">
      <div class="info-row"><span class="info-label">Role:</span><span class="info-val">${role}</span></div>
      <div class="info-row"><span class="info-label">Interview Type:</span><span class="info-val">${interviewType}</span></div>
      <div class="info-row"><span class="info-label">Date:</span><span class="info-val">${date}</span></div>
      <div class="info-row"><span class="info-label">Time:</span><span class="info-val">${time} ${timezone}</span></div>
      <div class="info-row"><span class="info-label">Duration:</span><span class="info-val">${duration} minutes</span></div>
    </div>

    <p style="margin: 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      <strong>Preparation Tip:</strong> ${instructions}
    </p>
    <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
      Good luck!<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Your interview for ${role} is confirmed for ${date} at ${time} ${timezone}`,
    content,
    callToAction: {
      label: 'Enter Interview Room',
      url: interviewUrl,
    },
    platformName,
  });

  const text = `Hi ${candidateName},

Your interview has been successfully scheduled.

Role: ${role}
Interview Type: ${interviewType}
Date: ${date}
Time: ${time} ${timezone}
Duration: ${duration} minutes

Interview Link:
${interviewUrl}

Please join a few minutes before the scheduled time.

Good luck!
${platformName} Team`;

  return { subject, html, text };
};
