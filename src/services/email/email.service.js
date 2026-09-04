import { Resend } from 'resend';
import EmailNotification from '../../models/EmailNotification.model.js';
import { renderInterviewScheduledEmail } from './templates/interviewScheduled.template.js';
import { renderInterviewRescheduledEmail } from './templates/interviewRescheduled.template.js';
import { renderInterviewCancelledEmail } from './templates/interviewCancelled.template.js';
import { renderInterviewReminder24hEmail } from './templates/interviewReminder24h.template.js';
import { renderInterviewReminder1hEmail } from './templates/interviewReminder1h.template.js';
import { renderInterviewCompletedEmail } from './templates/interviewCompleted.template.js';
import { renderInterviewReportEmail } from './templates/interviewReport.template.js';

class EmailService {
  constructor() {
    this.resend = null;
    this.initClient();
  }

  initClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.resend = new Resend(apiKey.trim());
    } else {
      this.resend = null;
    }
  }

  getFromEmail() {
    return process.env.EMAIL_FROM || 'MockAI Interviews <onboarding@resend.dev>';
  }

  getAppUrl() {
    return process.env.APP_URL || 'http://localhost:5175';
  }

  /**
   * Helper to format UTC timestamps into candidate timezone
   */
  formatDateTime(date, timezone = 'Asia/Kolkata') {
    if (!date) return { dateStr: '', timeStr: '', tzStr: timezone };
    const d = new Date(date);
    try {
      const dateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);

      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);

      const tzStr = timezone.includes('/') ? timezone.split('/')[1].replace('_', ' ') : timezone;
      return { dateStr, timeStr, tzStr };
    } catch {
      return {
        dateStr: d.toDateString(),
        timeStr: d.toLocaleTimeString(),
        tzStr: timezone,
      };
    }
  }

  /**
   * Core dispatch method with retry logic, idempotency, and database logging
   */
  async sendEmailWithRetry({
    interviewId,
    candidateId,
    recipientEmail,
    emailType,
    subject,
    html,
    text,
    scheduledFor = null,
    metadata = {},
    maxRetries = 3,
  }) {
    // 1. Check idempotency: avoid duplicate emails for same interview + emailType
    const existingSent = await EmailNotification.findOne({
      interviewId,
      emailType,
      status: 'SENT',
    });

    if (existingSent) {
      console.log(`[EmailService] Duplicate send prevented for ${emailType} on interview ${interviewId}`);
      return { status: 'SKIPPED', message: 'Already sent' };
    }

    // 2. Create or find PENDING notification record in DB
    let logRecord = await EmailNotification.create({
      interviewId,
      candidateId,
      recipientEmail,
      emailType,
      status: 'PENDING',
      provider: 'resend',
      scheduledFor,
      metadata,
    });

    // 3. If Resend is not configured (e.g. dev mode without key), log gracefully
    this.initClient();
    if (!this.resend) {
      console.warn(`[EmailService] RESEND_API_KEY is not configured. Email logged as SIMULATED_SENT.`);
      logRecord.status = 'SENT';
      logRecord.providerMessageId = `mock_${Date.now()}`;
      logRecord.sentAt = new Date();
      await logRecord.save();
      return { status: 'SENT', mock: true };
    }

    // 4. Retry loop with exponential backoff
    let attempts = 0;
    let lastError = null;

    while (attempts < maxRetries) {
      attempts += 1;
      logRecord.retryCount = attempts;

      try {
        // Resend test sandbox rejects @example.com / @test.com domains.
        // Route mock domains to Resend's official test delivery address while logging actual recipient.
        let toAddress = recipientEmail;
        if (
          toAddress.endsWith('@example.com') ||
          toAddress.endsWith('@test.com') ||
          toAddress.includes('example') ||
          toAddress.includes('test_')
        ) {
          toAddress = 'delivered@resend.dev';
        }

        const { data, error } = await this.resend.emails.send({
          from: this.getFromEmail(),
          to: toAddress,
          subject,
          html,
          text,
        });

        if (error) {
          throw new Error(error.message || JSON.stringify(error));
        }

        // Success!
        logRecord.status = 'SENT';
        logRecord.providerMessageId = data?.id || `resend_${Date.now()}`;
        logRecord.sentAt = new Date();
        logRecord.errorMessage = null;
        await logRecord.save();

        console.log(`[EmailService] Successfully sent ${emailType} to ${recipientEmail} (ID: ${logRecord.providerMessageId})`);
        return { status: 'SENT', messageId: logRecord.providerMessageId };
      } catch (err) {
        lastError = err;
        console.error(`[EmailService] Attempt ${attempts}/${maxRetries} failed for ${emailType}: ${err.message}`);

        if (attempts < maxRetries) {
          // Exponential backoff: 500ms, 1500ms...
          await new Promise((res) => setTimeout(res, attempts * 750));
        }
      }
    }

    // If all retries fail, record FAILED status (do not throw, ensure non-blocking)
    logRecord.status = 'FAILED';
    logRecord.errorMessage = lastError?.message || 'Failed after max retries';
    await logRecord.save();

    console.error(`[EmailService] Permanent failure sending ${emailType} to ${recipientEmail}: ${logRecord.errorMessage}`);
    return { status: 'FAILED', error: logRecord.errorMessage };
  }

  // ---- High Level Event Methods ----

  /**
   * 1. Send Interview Scheduled Email
   */
  async sendInterviewScheduled(interview, candidate) {
    try {
      const timezone = interview.timezone || 'Asia/Kolkata';
      const scheduledDate = interview.scheduledAt || interview.createdAt || new Date();
      const { dateStr, timeStr, tzStr } = this.formatDateTime(scheduledDate, timezone);
      const appUrl = this.getAppUrl();
      const interviewUrl = `${appUrl}/interview/${interview._id}`;

      const { subject, html, text } = renderInterviewScheduledEmail({
        candidateName: candidate.name || 'Candidate',
        role: interview.role,
        interviewType: interview.interviewType,
        date: dateStr,
        time: timeStr,
        timezone: tzStr,
        duration: interview.duration || 30,
        interviewUrl,
      });

      return await this.sendEmailWithRetry({
        interviewId: interview._id,
        candidateId: candidate._id,
        recipientEmail: candidate.email,
        emailType: 'INTERVIEW_SCHEDULED',
        subject,
        html,
        text,
        scheduledFor: interview.scheduledAt,
      });
    } catch (err) {
      console.error('[EmailService] sendInterviewScheduled failed non-blockingly:', err.message);
    }
  }

  /**
   * 2. Send Interview Rescheduled Email
   */
  async sendInterviewRescheduled(interview, candidate, previousDate) {
    try {
      const timezone = interview.timezone || 'Asia/Kolkata';
      const newScheduledDate = interview.scheduledAt || new Date();
      const { dateStr: newDate, timeStr: newTime, tzStr } = this.formatDateTime(newScheduledDate, timezone);
      const { dateStr: prevDate, timeStr: prevTime } = this.formatDateTime(previousDate, timezone);
      const appUrl = this.getAppUrl();
      const interviewUrl = `${appUrl}/interview/${interview._id}`;

      const { subject, html, text } = renderInterviewRescheduledEmail({
        candidateName: candidate.name || 'Candidate',
        role: interview.role,
        previousDate: prevDate,
        previousTime: prevTime,
        newDate,
        newTime,
        timezone: tzStr,
        duration: interview.duration || 30,
        interviewUrl,
      });

      return await this.sendEmailWithRetry({
        interviewId: interview._id,
        candidateId: candidate._id,
        recipientEmail: candidate.email,
        emailType: 'INTERVIEW_RESCHEDULED',
        subject,
        html,
        text,
        scheduledFor: interview.scheduledAt,
      });
    } catch (err) {
      console.error('[EmailService] sendInterviewRescheduled failed non-blockingly:', err.message);
    }
  }

  /**
   * 3. Send Interview Cancelled Email
   */
  async sendInterviewCancelled(interview, candidate, reason) {
    try {
      const timezone = interview.timezone || 'Asia/Kolkata';
      const originalDate = interview.scheduledAt || interview.createdAt;
      const { dateStr, timeStr, tzStr } = this.formatDateTime(originalDate, timezone);
      const appUrl = this.getAppUrl();

      const { subject, html, text } = renderInterviewCancelledEmail({
        candidateName: candidate.name || 'Candidate',
        role: interview.role,
        originalDate: dateStr,
        originalTime: timeStr,
        timezone: tzStr,
        reason: reason || interview.cancellationReason || 'Candidate cancellation request',
        rescheduleUrl: `${appUrl}/setup`,
      });

      return await this.sendEmailWithRetry({
        interviewId: interview._id,
        candidateId: candidate._id,
        recipientEmail: candidate.email,
        emailType: 'INTERVIEW_CANCELLED',
        subject,
        html,
        text,
      });
    } catch (err) {
      console.error('[EmailService] sendInterviewCancelled failed non-blockingly:', err.message);
    }
  }

  /**
   * 4. Send Interview Reminder Email (24 hours or 1 hour before)
   */
  async sendInterviewReminder(interview, candidate, type = '24h') {
    try {
      const timezone = interview.timezone || 'Asia/Kolkata';
      const { dateStr, timeStr, tzStr } = this.formatDateTime(interview.scheduledAt, timezone);
      const appUrl = this.getAppUrl();
      const interviewUrl = `${appUrl}/interview/${interview._id}`;

      let subject, html, text;
      const emailType = type === '24h' ? 'INTERVIEW_REMINDER_24H' : 'INTERVIEW_REMINDER_1H';

      if (type === '24h') {
        ({ subject, html, text } = renderInterviewReminder24hEmail({
          candidateName: candidate.name || 'Candidate',
          role: interview.role,
          date: dateStr,
          time: timeStr,
          timezone: tzStr,
          duration: interview.duration || 30,
          interviewUrl,
        }));
      } else {
        ({ subject, html, text } = renderInterviewReminder1hEmail({
          candidateName: candidate.name || 'Candidate',
          role: interview.role,
          time: timeStr,
          timezone: tzStr,
          duration: interview.duration || 30,
          interviewUrl,
        }));
      }

      return await this.sendEmailWithRetry({
        interviewId: interview._id,
        candidateId: candidate._id,
        recipientEmail: candidate.email,
        emailType,
        subject,
        html,
        text,
        scheduledFor: interview.scheduledAt,
      });
    } catch (err) {
      console.error(`[EmailService] sendInterviewReminder (${type}) failed non-blockingly:`, err.message);
    }
  }

  /**
   * 5. Send Interview Completed Email
   */
  async sendInterviewCompleted(interview, candidate) {
    try {
      const appUrl = this.getAppUrl();
      const resultUrl = `${appUrl}/feedback/${interview._id}`;
      const actualDuration = interview.duration || 25;

      const { subject, html, text } = renderInterviewCompletedEmail({
        candidateName: candidate.name || 'Candidate',
        role: interview.role,
        actualDuration,
        resultUrl,
      });

      return await this.sendEmailWithRetry({
        interviewId: interview._id,
        candidateId: candidate._id,
        recipientEmail: candidate.email,
        emailType: 'INTERVIEW_COMPLETED',
        subject,
        html,
        text,
      });
    } catch (err) {
      console.error('[EmailService] sendInterviewCompleted failed non-blockingly:', err.message);
    }
  }

  /**
   * 6. Send Interview Report / Results Summary Email
   */
  async sendInterviewReport(interview, candidate) {
    try {
      const appUrl = this.getAppUrl();
      const reportUrl = `${appUrl}/feedback/${interview._id}`;
      const feedback = interview.feedback || {};

      const { subject, html, text } = renderInterviewReportEmail({
        candidateName: candidate.name || 'Candidate',
        role: interview.role,
        overallScore: interview.overallScore || feedback.overallScore || 0,
        categoryScores: feedback.categoryScores || {},
        strengths: feedback.strengths || [],
        areasOfImprovement: feedback.areasOfImprovement || [],
        reportUrl,
      });

      return await this.sendEmailWithRetry({
        interviewId: interview._id,
        candidateId: candidate._id,
        recipientEmail: candidate.email,
        emailType: 'INTERVIEW_REPORT',
        subject,
        html,
        text,
      });
    } catch (err) {
      console.error('[EmailService] sendInterviewReport failed non-blockingly:', err.message);
    }
  }
}

export const emailService = new EmailService();
export default emailService;
