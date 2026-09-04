/**
 * Base responsive HTML email layout compatible with Gmail, Apple Mail, Outlook, etc.
 */
export const wrapEmailLayout = ({ title, preheader, content, callToAction, platformName = 'MockAI Studio' }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    /* Reset styles */
    body, p, h1, h2, h3, h4, table, td {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #0b0f19;
      color: #334155;
      -webkit-font-smoothing: antialiased;
      width: 100% !important;
      height: 100% !important;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }
    .header-banner {
      background: linear-gradient(135deg, #070a13 0%, #0f172a 100%);
      padding: 32px 36px;
      text-align: left;
      border-bottom: 3px solid #06b6d4;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .brand-tag {
      font-size: 11px;
      font-weight: 700;
      color: #06b6d4;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .content-body {
      padding: 36px;
      color: #1e293b;
      font-size: 15px;
      line-height: 1.6;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      margin-bottom: 10px;
      display: flex;
    }
    .info-label {
      font-weight: 700;
      color: #475569;
      width: 130px;
      display: inline-block;
    }
    .info-val {
      color: #0f172a;
      font-weight: 600;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
      color: #ffffff !important;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      margin: 20px 0 10px;
      text-align: center;
    }
    .footer {
      padding: 24px 36px;
      background-color: #f1f5f9;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .content-body, .header-banner, .footer {
        padding: 24px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Hidden Preheader text for email client preview -->
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader || title}
  </div>

  <table role="presentation" width="100%" bgcolor="#0b0f19" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <div class="email-container">
          <!-- Header -->
          <div class="header-banner">
            <div class="brand-title">${platformName}</div>
            <div class="brand-tag">AI Technical Interview Platform</div>
          </div>

          <!-- Main Content -->
          <div class="content-body">
            ${content}

            ${
              callToAction
                ? `<div style="text-align: center; margin: 24px 0;">
                    <a href="${callToAction.url}" class="cta-btn" target="_blank">
                      ${callToAction.label}
                    </a>
                  </div>`
                : ''
            }
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${platformName}. All rights reserved.</p>
            <p style="margin-top: 6px;">
              This is an automated transactional notification regarding your technical interview on ${platformName}.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
