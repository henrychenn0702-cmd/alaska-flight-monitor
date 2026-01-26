import sgMail from "@sendgrid/mail";

/**
 * Email service for sending notifications via SendGrid
 */

let isInitialized = false;

/**
 * Initialize SendGrid with API key
 */
export function initializeEmailService(apiKey: string): void {
  if (!apiKey) {
    console.warn("[EmailService] No SendGrid API key provided");
    return;
  }
  
  sgMail.setApiKey(apiKey);
  isInitialized = true;
  console.log("[EmailService] SendGrid initialized");
}

/**
 * Send email notification about found deals
 */
export async function sendDealNotification(
  to: string,
  deals: Array<{ date: string; miles: number; fees: number }>,
  filterMiles: number
): Promise<boolean> {
  if (!isInitialized) {
    console.warn("[EmailService] SendGrid not initialized, skipping email");
    return false;
  }

  try {
    const dealsList = deals
      .map((d) => `  • ${d.date}: ${d.miles / 1000}k + $${d.fees}`)
      .join("\n");

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@manus.space",
      subject: `🎉 發現 ${deals.length} 個 ${filterMiles / 1000}k 特價里程票!`,
      text: `阿拉斯加航空里程票監控系統通知

您好!

系統發現了 ${deals.length} 個符合您篩選器(${filterMiles / 1000}k)的特價里程票:

${dealsList}

航線: SEA → TPE
艙等: Partner Business (星宇航空)
月份: 2026年2月

請盡快前往阿拉斯加航空官網預訂:
https://www.alaskaair.com/search/calendar?O=SA2&D=TPE&OD=2026-02-01&A=1&RT=false&RequestType=Calendar&int=flightresultsmicrosite%3Aviewby-calendar&locale=en-us&ShoppingMethod=onlineaward&FareType=Partner+Business&CM=2026-02&DD=2026-02-01

---
此郵件由阿拉斯加航空里程票監控系統自動發送
`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .deal-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .deal-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .deal-item:last-child { border-bottom: none; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 發現 ${deals.length} 個 ${filterMiles / 1000}k 特價里程票!</h1>
    </div>
    <div class="content">
      <p>您好!</p>
      <p>系統發現了 <strong>${deals.length} 個</strong>符合您篩選器(<strong>${filterMiles / 1000}k</strong>)的特價里程票:</p>
      
      <div class="deal-list">
        ${deals.map((d) => `<div class="deal-item">📅 ${d.date}: <strong>${d.miles / 1000}k</strong> + $${d.fees}</div>`).join("")}
      </div>
      
      <p><strong>航線:</strong> SEA → TPE<br>
      <strong>艙等:</strong> Partner Business (星宇航空)<br>
      <strong>月份:</strong> 2026年2月</p>
      
      <a href="https://www.alaskaair.com/search/calendar?O=SA2&D=TPE&OD=2026-02-01&A=1&RT=false&RequestType=Calendar&int=flightresultsmicrosite%3Aviewby-calendar&locale=en-us&ShoppingMethod=onlineaward&FareType=Partner+Business&CM=2026-02&DD=2026-02-01" class="button">前往預訂</a>
      
      <div class="footer">
        <p>此郵件由阿拉斯加航空里程票監控系統自動發送</p>
      </div>
    </div>
  </div>
</body>
</html>
`,
    };

    await sgMail.send(msg);
    console.log(`[EmailService] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return false;
  }
}
