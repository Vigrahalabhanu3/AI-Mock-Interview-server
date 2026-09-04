import Interview from '../../models/Interview.model.js';
import User from '../../models/User.model.js';
import EmailNotification from '../../models/EmailNotification.model.js';
import emailService from './email.service.js';

/**
 * Production-safe server-side interview reminder scheduler
 * Checks upcoming scheduled sessions every 5 minutes
 */
export async function checkAndSendReminders() {
  try {
    const now = new Date();
    // Only search future or active scheduled interviews
    const upcomingInterviews = await Interview.find({
      status: 'scheduled',
      scheduledAt: { $gt: now },
    }).populate('userId');

    for (const interview of upcomingInterviews) {
      const candidate = interview.userId;
      if (!candidate || !candidate.email) continue;

      const timeDiffMs = new Date(interview.scheduledAt).getTime() - now.getTime();
      const diffHours = timeDiffMs / (1000 * 60 * 60);

      // 1. Check 24h Reminder Window (23h to 25h before scheduled time)
      if (diffHours >= 23 && diffHours <= 25) {
        const alreadySent = await EmailNotification.findOne({
          interviewId: interview._id,
          emailType: 'INTERVIEW_REMINDER_24H',
          status: { $in: ['SENT', 'PENDING'] },
        });

        if (!alreadySent) {
          console.log(`[Scheduler] Dispatching 24h reminder for interview ${interview._id} to ${candidate.email}`);
          await emailService.sendInterviewReminder(interview, candidate, '24h');
          interview.emailStatus = { ...(interview.emailStatus || {}), reminder24h: true };
          await interview.save();
        }
      }

      // 2. Check 1h Reminder Window (45 mins to 75 mins before scheduled time)
      if (diffHours >= 0.75 && diffHours <= 1.25) {
        const alreadySent = await EmailNotification.findOne({
          interviewId: interview._id,
          emailType: 'INTERVIEW_REMINDER_1H',
          status: { $in: ['SENT', 'PENDING'] },
        });

        if (!alreadySent) {
          console.log(`[Scheduler] Dispatching 1h reminder for interview ${interview._id} to ${candidate.email}`);
          await emailService.sendInterviewReminder(interview, candidate, '1h');
          interview.emailStatus = { ...(interview.emailStatus || {}), reminder1h: true };
          await interview.save();
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error running reminder sweep:', err.message);
  }
}

let intervalId = null;

export function startEmailReminderScheduler(intervalMs = 5 * 60 * 1000) {
  if (intervalId) return;

  // Run initial sweep after short delay on server boot
  setTimeout(() => {
    checkAndSendReminders().catch(() => {});
  }, 10000);

  // Periodic interval
  intervalId = setInterval(() => {
    checkAndSendReminders().catch(() => {});
  }, intervalMs);

  console.log('[Scheduler] Email Reminder Scheduler active (polling every 5 minutes)');
}

export function stopEmailReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
