// Email delivery. When a Resend API key is configured in Settings, mail is
// actually sent via Resend; otherwise it's queued to the Outbox. Either way a
// record is saved so every message is viewable under Settings → Outbox.
import { getDB, mutate, uid } from "./db";
import type { EmailLog } from "./types";

export function render(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export interface EmailCta {
  label: string;
  url: string;
}

interface EmailFooterContact {
  salesName: string;
  salesPhone: string;
  marketingName: string;
  marketingPhone: string;
  salesEmail: string;
  infoEmail: string;
}

function envString(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : "";
}

function envBool(name: string) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return undefined;
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function envNumber(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Branded HTML email template — table-based for email client compat.
export function buildHtml(
  subject: string,
  body: string,
  fromName = "Elite Shade Solutions",
  fromEmail = "sales@eliteshadesolutions.co.za",
  footer?: EmailFooterContact,
  cta?: EmailCta
): string {
  const contact = footer ?? {
    salesName: "Jean-Pierre Miller",
    salesPhone: "067 618 2422",
    marketingName: "Michael Theron",
    marketingPhone: "060 949 1197",
    salesEmail: "sales@eliteshadesolutions.co.za",
    infoEmail: "info@eliteshadesolutions.co.za",
  };
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
          ${cta ? `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
            <tr>
              <td style="background:#c9a24b;border-radius:10px;">
                <a href="${cta.url}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:800;color:#1c2733;text-decoration:none;letter-spacing:0.02em;">${cta.label} →</a>
              </td>
            </tr>
          </table>
          <p style="margin:10px 0 0;font-size:12px;color:#5b6b7a;">Or copy this link into your browser:<br/><a href="${cta.url}" style="color:#c9a24b;word-break:break-all;">${cta.url}</a></p>
          ` : ""}
        </td>
      </tr>

      <!-- CTA STRIP -->
      <tr>
        <td style="padding:0 36px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ead4;border-radius:10px;padding:0;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#5b6b7a;">Questions?</p>
                <p style="margin:0;font-size:14px;color:#283746;line-height:1.6;">Reply to this email, call ${contact.salesName} on ${contact.salesPhone}, or contact ${contact.marketingName} on ${contact.marketingPhone}.</p>
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
                Cape Town, Western Cape<br/>
                ${contact.salesName} · Sales · ${contact.salesPhone}<br/>
                ${contact.marketingName} · Marketing / Online sales · ${contact.marketingPhone}
              </td>
              <td align="right" style="font-size:11px;color:#6f7f8c;">
                <a href="mailto:${contact.salesEmail}" style="color:#c9a24b;text-decoration:none;">${contact.salesEmail}</a><br/>
                <a href="mailto:${contact.infoEmail}" style="color:#c9a24b;text-decoration:none;">${contact.infoEmail}</a><br/>
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

export async function sendEmail(to: string, subject: string, body: string, cta?: EmailCta): Promise<EmailLog> {
  const db = await getDB();
  const key = envString("ELITE_RESEND_API_KEY") || db.settings.resend_api_key?.trim();
  const from = envString("ELITE_EMAIL_FROM") || db.settings.email_from || "sales@eliteshadesolutions.co.za";
  const fromName = db.settings.company_name || "Elite Shade Solutions";
  const html = buildHtml(subject, body, fromName, from, {
    salesName: db.settings.sales_name || "Jean-Pierre Miller",
    salesPhone: db.settings.sales_phone || "067 618 2422",
    marketingName: db.settings.marketing_name || "Michael Theron",
    marketingPhone: db.settings.marketing_phone || "060 949 1197",
    salesEmail: db.settings.sales_email || from,
    infoEmail: db.settings.info_email || "info@eliteshadesolutions.co.za",
  }, cta);
  const smtpHost = envString("ELITE_SMTP_HOST") || db.settings.smtp_host || "";
  const smtpPort = envNumber("ELITE_SMTP_PORT") || db.settings.smtp_port || 587;
  const smtpUser = envString("ELITE_SMTP_USER") || db.settings.smtp_user || "";
  const smtpPass = envString("ELITE_SMTP_PASS") || db.settings.smtp_pass || "";
  const smtpSecure = envBool("ELITE_SMTP_SECURE") ?? !!db.settings.smtp_secure;
  const envProvider = envString("ELITE_EMAIL_PROVIDER");
  const provider = (envProvider === "smtp" || envProvider === "resend" || envProvider === "outbox")
    ? envProvider
    : (db.settings.email_provider || (key ? "resend" : "outbox"));

  let channel: EmailLog["channel"] = "outbox";
  let status: EmailLog["status"] = "queued";

  if (provider === "smtp" && smtpHost && smtpUser) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      await transporter.sendMail({
        from: `${fromName} <${from}>`,
        to,
        subject,
        text: body,
        html,
      });
      channel = "smtp";
      status = "sent";
    } catch {
      channel = "smtp";
      status = "failed";
    }
  } else if (provider === "resend" && key) {
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
