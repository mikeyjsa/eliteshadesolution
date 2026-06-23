// Email delivery. When a Resend API key is configured in Settings, mail is
// actually sent via Resend; otherwise it's queued to the Outbox. Either way a
// record is saved so every message is viewable under Settings → Outbox.
import { getDB, mutate, uid } from "./db";
import type { EmailLog } from "./types";

export function render(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

// Branded HTML email template — table-based for email client compat.
export function buildHtml(subject: string, body: string, fromName = "Elite Shade Solutions"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#e8ecef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8ecef;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,39,51,0.12);">

      <!-- HEADER -->
      <tr>
        <td style="background:#1c2733;padding:28px 36px 20px;text-align:left;">
          <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">ELITE SHADE</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#c9a24b;margin-top:4px;">Engineered Shade. Exceptional Spaces.</div>
          <div style="height:3px;background:linear-gradient(90deg,#c9a24b,transparent);margin-top:18px;border-radius:2px;"></div>
        </td>
      </tr>

      <!-- SUBJECT BAND -->
      <tr>
        <td style="background:#283746;padding:14px 36px;">
          <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">${subject}</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:36px 36px 28px;">
          ${body.split("\n").map((line) => line.trim()
            ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#22303c;">${line}</p>`
            : "<br/>"
          ).join("")}
        </td>
      </tr>

      <!-- CTA STRIP -->
      <tr>
        <td style="padding:0 36px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ead4;border-radius:10px;padding:0;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#5b6b7a;">Questions?</p>
                <p style="margin:0;font-size:14px;color:#283746;line-height:1.6;">Reply to this email or reach us on WhatsApp — one of our owners will get back to you directly.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#1c2733;padding:20px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#9fb0bd;line-height:1.7;">
                <strong style="color:#fff;">${fromName}</strong><br/>
                Cape Town, Western Cape · <a href="mailto:quotes@eliteshadesolutions.co.za" style="color:#c9a24b;text-decoration:none;">quotes@eliteshadesolutions.co.za</a>
              </td>
              <td align="right" style="font-size:11px;color:#6f7f8c;">
                Prices are indicative estimates.<br/>Final pricing confirmed after a free site survey.
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<EmailLog> {
  const db = await getDB();
  const key = db.settings.resend_api_key?.trim();
  const from = db.settings.email_from || "quotes@eliteshadesolutions.co.za";
  const fromName = db.settings.company_name || "Elite Shade Solutions";
  const html = buildHtml(subject, body, fromName);

  let channel: EmailLog["channel"] = "outbox";
  let status: EmailLog["status"] = "queued";

  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${fromName} <${from}>`, to, subject, text: body, html }),
      });
      channel = "resend";
      status = res.ok ? "sent" : "failed";
    } catch {
      channel = "resend";
      status = "failed";
    }
  }

  return mutate((d) => {
    const log: EmailLog = {
      id: uid("eml_"),
      to,
      subject,
      body,
      html,
      sent_at: new Date().toISOString(),
      channel,
      status,
    };
    d.emails.unshift(log);
    return log;
  });
}
