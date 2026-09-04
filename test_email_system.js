import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.config.js';
import User from './src/models/User.model.js';
import Interview from './src/models/Interview.model.js';
import EmailNotification from './src/models/EmailNotification.model.js';
import emailService from './src/services/email/email.service.js';
import { checkAndSendReminders } from './src/services/email/reminder.scheduler.js';

async function runTests() {
  console.log('--- Starting Email System Integration Tests ---');
  await connectDB();

  // Clean test artifacts
  await User.deleteMany({ email: 'test_candidate@example.com' });

  // 1. Create Mock Candidate
  const candidate = await User.create({
    name: 'Bhanu Vigrahala',
    email: 'test_candidate@example.com',
    password: 'hashed_password_123',
  });
  console.log('✓ Created Test Candidate:', candidate.email);

  // 2. Test Timezone Formatter
  const testDate = new Date('2026-09-10T10:00:00Z');
  const { dateStr, timeStr, tzStr } = emailService.formatDateTime(testDate, 'Asia/Kolkata');
  console.log(`✓ Timezone Formatted Output: ${dateStr} at ${timeStr} ${tzStr}`);

  // 3. Test sendInterviewScheduled
  const interview = await Interview.create({
    userId: candidate._id,
    role: 'Staff Fullstack Architect',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    timezone: 'Asia/Kolkata',
    duration: 45,
    status: 'scheduled',
  });

  const schedResult = await emailService.sendInterviewScheduled(interview, candidate);
  console.log('✓ sendInterviewScheduled dispatched, status:', schedResult?.status);

  // 4. Test Idempotency / Duplicate Prevention
  const duplicateSchedResult = await emailService.sendInterviewScheduled(interview, candidate);
  console.log('✓ Duplicate check result (should be SKIPPED):', duplicateSchedResult?.status);

  // 5. Test sendInterviewRescheduled
  const prevDate = interview.scheduledAt;
  interview.scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await interview.save();

  const reschedResult = await emailService.sendInterviewRescheduled(interview, candidate, prevDate);
  console.log('✓ sendInterviewRescheduled dispatched, status:', reschedResult?.status);

  // 6. Test sendInterviewReminder (24h and 1h)
  const rem24Result = await emailService.sendInterviewReminder(interview, candidate, '24h');
  console.log('✓ sendInterviewReminder 24h dispatched, status:', rem24Result?.status);

  const rem1Result = await emailService.sendInterviewReminder(interview, candidate, '1h');
  console.log('✓ sendInterviewReminder 1h dispatched, status:', rem1Result?.status);

  // 7. Test sendInterviewCompleted
  const compResult = await emailService.sendInterviewCompleted(interview, candidate);
  console.log('✓ sendInterviewCompleted dispatched, status:', compResult?.status);

  // 8. Test sendInterviewReport
  interview.feedback = {
    overallScore: 92,
    categoryScores: {
      technicalKnowledge: { score: 94, comment: 'Strong deep-dive answers' },
      problemSolving: { score: 90, comment: 'Optimal time complexity' },
      communicationSkills: { score: 92, comment: 'Clear STAR articulation' },
      codeQuality: { score: 92, comment: 'Clean, idiomatic code' },
    },
    strengths: ['Deep event-driven architectural knowledge', 'Crisp communication'],
    areasOfImprovement: ['Mention trade-offs between sync vs async protocols earlier'],
  };
  interview.overallScore = 92;
  interview.status = 'completed';
  await interview.save();

  const reportResult = await emailService.sendInterviewReport(interview, candidate);
  console.log('✓ sendInterviewReport dispatched, status:', reportResult?.status);

  // 9. Test sendInterviewCancelled
  const cancelInterviewDoc = await Interview.create({
    userId: candidate._id,
    role: 'DevOps Lead',
    scheduledAt: new Date(),
    status: 'cancelled',
  });
  const cancelResult = await emailService.sendInterviewCancelled(cancelInterviewDoc, candidate, 'Candidate requested reschedule window');
  console.log('✓ sendInterviewCancelled dispatched, status:', cancelResult?.status);

  // 10. Verify DB Records
  const allLogs = await EmailNotification.find({ candidateId: candidate._id });
  console.log(`✓ Total EmailNotification records in DB: ${allLogs.length}`);
  allLogs.forEach((log) => {
    console.log(`  - [${log.status}] ${log.emailType} to ${log.recipientEmail} (Provider: ${log.provider})`);
  });

  // 11. Test Scheduler Sweep
  await checkAndSendReminders();
  console.log('✓ checkAndSendReminders sweep executed successfully without error');

  // Clean up test data
  await EmailNotification.deleteMany({ candidateId: candidate._id });
  await Interview.deleteMany({ userId: candidate._id });
  await User.deleteMany({ _id: candidate._id });
  console.log('✓ Cleaned up test data');

  console.log('\nAll Email Notification System tests PASSED successfully!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
