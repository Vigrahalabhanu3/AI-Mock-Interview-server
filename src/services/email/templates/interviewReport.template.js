import { wrapEmailLayout } from './baseLayout.js';

export const renderInterviewReportEmail = ({
  candidateName,
  role,
  overallScore,
  categoryScores = {},
  strengths = [],
  areasOfImprovement = [],
  reportUrl,
  platformName = 'MockAI Studio',
}) => {
  const subject = `Your Interview Results – ${role}`;

  const technicalScore = categoryScores.technicalKnowledge?.score;
  const problemSolvingScore = categoryScores.problemSolving?.score;
  const communicationScore = categoryScores.communicationSkills?.score;
  const codeQualityScore = categoryScores.codeQuality?.score;

  const content = `
    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
      Interview Results
    </h2>
    <p style="margin-bottom: 20px; font-size: 15px; color: #475569;">
      Hi ${candidateName}, here is the executive summary of your recent interview for <strong>${role}</strong>:
    </p>

    <!-- Overall Score Box -->
    <div style="background: #0f172a; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
        Overall Score
      </div>
      <div style="font-size: 42px; font-weight: 800; color: #38bdf8; margin: 4px 0;">
        ${overallScore || 0}<span style="font-size: 20px; color: #64748b;"> / 100</span>
      </div>
      <div style="font-size: 13px; color: #a5f3fc; font-weight: 600;">
        ${overallScore >= 80 ? 'Target: Senior Engineer Ready' : overallScore >= 65 ? 'Proficient Performance' : 'Practice Recommended'}
      </div>
    </div>

    <!-- Category Scores Table -->
    <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Category Breakdown</h3>
    <table width="100%" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
      ${
        technicalScore !== undefined
          ? `<tr>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">Technical Depth:</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right; color: #0284c7;">${technicalScore} / 100</td>
            </tr>`
          : ''
      }
      ${
        problemSolvingScore !== undefined
          ? `<tr>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">Problem Solving:</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right; color: #6366f1;">${problemSolvingScore} / 100</td>
            </tr>`
          : ''
      }
      ${
        communicationScore !== undefined
          ? `<tr>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">Communication:</td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right; color: #10b981;">${communicationScore} / 100</td>
            </tr>`
          : ''
      }
      ${
        codeQualityScore !== undefined
          ? `<tr>
              <td style="padding: 12px 16px; font-weight: 600; color: #334155;">Code Quality:</td>
              <td style="padding: 12px 16px; font-weight: 700; text-align: right; color: #8b5cf6;">${codeQualityScore} / 100</td>
            </tr>`
          : ''
      }
    </table>

    <!-- Strengths -->
    ${
      strengths && strengths.length > 0
        ? `<div style="margin-bottom: 20px; background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 0 8px 8px 0;">
            <div style="font-weight: 700; color: #15803d; font-size: 14px; margin-bottom: 6px;">Key Strengths:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534; line-height: 1.5;">
              ${strengths.map((s) => `<li>${s}</li>`).join('')}
            </ul>
          </div>`
        : ''
    }

    <!-- Areas for Improvement -->
    ${
      areasOfImprovement && areasOfImprovement.length > 0
        ? `<div style="margin-bottom: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 0 8px 8px 0;">
            <div style="font-weight: 700; color: #b45309; font-size: 14px; margin-bottom: 6px;">Areas for Improvement:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #92400e; line-height: 1.5;">
              ${areasOfImprovement.map((a) => `<li>${a}</li>`).join('')}
            </ul>
          </div>`
        : ''
    }

    <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
      Keep practicing to elevate your readiness for your next real-world technical screen!<br>
      <strong>${platformName} Team</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    preheader: `Your score for ${role}: ${overallScore}/100. View your full AI feedback scorecard.`,
    content,
    callToAction: {
      label: 'View Full Interview Report',
      url: reportUrl,
    },
    platformName,
  });

  const text = `Interview Results

Role:
${role}

Overall Score:
${overallScore}/100

${technicalScore !== undefined ? `Technical Skills:\n${technicalScore}/100\n\n` : ''}${problemSolvingScore !== undefined ? `Problem Solving:\n${problemSolvingScore}/100\n\n` : ''}${communicationScore !== undefined ? `Communication:\n${communicationScore}/100\n\n` : ''}${codeQualityScore !== undefined ? `Code Quality:\n${codeQualityScore}/100\n\n` : ''}Strengths:
${(strengths || []).join('\n• ')}

Areas for Improvement:
${(areasOfImprovement || []).join('\n• ')}

[View Full Interview Report]:
${reportUrl}`;

  return { subject, html, text };
};
