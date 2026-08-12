// Email delivery. When a Resend API key is configured in Settings, mail is
// actually sent via Resend; otherwise it's queued to the Outbox. Either way a
// record is saved so every message is viewable under Settings → Outbox.
import { getDB, mutate, uid } from "./db";
import type { EmailLog } from "./types";
import { promises as fs } from "fs";

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
    salesPhone: "071 581 4268",
    marketingName: "Michael Theron",
    marketingPhone: "060 949 1197",
    salesEmail: "sales@eliteshadesolutions.co.za",
    infoEmail: "info@eliteshadesolutions.co.za",
  };
  const salesPhoneHref = `+${contact.salesPhone.replace(/\D/g, "").replace(/^0/, "27")}`;
  const marketingPhoneHref = `+${contact.marketingPhone.replace(/\D/g, "").replace(/^0/, "27")}`;
  const isMarketingSender = fromEmail.trim().toLowerCase() === contact.infoEmail.trim().toLowerCase();
  const senderName = isMarketingSender ? contact.marketingName : contact.salesName;
  const senderRole = isMarketingSender ? "Marketing / Online Sales" : "Sales";
  const senderPhone = isMarketingSender ? contact.marketingPhone : contact.salesPhone;
  const senderPhoneHref = isMarketingSender ? marketingPhoneHref : salesPhoneHref;
  const senderEmail = isMarketingSender ? contact.infoEmail : contact.salesEmail;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
<style>
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  @media only screen and (max-width: 620px) {
    .email-wrap { padding: 12px 0 !important; }
    .email-card { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
    .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .footer-stack { display: block !important; width: 100% !important; max-width: 100% !important; text-align: left !important; }
    .footer-spacer { display: none !important; width: 0 !important; height: 0 !important; }
    .footer-details { padding-top: 18px !important; }
    .footer-actions { padding-top: 14px !important; text-align: left !important; }
    .footer-button { display: block !important; text-align: center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#e8ecef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-wrap" style="background:#e8ecef;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-card" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,39,51,0.12);">

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
        <td class="email-pad" style="padding:36px 36px 28px;">
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
        <td class="email-pad" style="padding:0 36px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5ff;border-left:4px solid #1769e0;border-radius:10px;padding:0;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#1769e0;">Questions about your shade project?</p>
                <p style="margin:0;font-size:14px;color:#283746;line-height:1.65;">Reply to this email or call <a href="tel:${senderPhoneHref}" style="color:#1769e0;text-decoration:none;font-weight:800;">${senderName} on ${senderPhone}</a>. We are ready to help with measurements, materials, quotes and installation planning.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td class="email-pad" style="background:#10213d;padding:28px 36px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="footer-stack" width="185" valign="top" style="width:185px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;">
                  <tr>
                    <td style="padding:14px 12px;">
                      <a href="https://eliteshadesolutions.co.za" target="_blank" style="text-decoration:none;">
                        <img src="https://eliteshadesolutions.co.za/_next/image?url=%2Flogo.png&amp;w=640&amp;q=75" width="160" alt="Elite Shade Solutions" style="display:block;width:160px;max-width:100%;height:auto;" />
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="footer-spacer" width="22" style="width:22px;">&nbsp;</td>
              <td class="footer-stack footer-details" valign="top" style="font-size:12px;color:#b9c7d8;line-height:1.7;">
                <strong style="font-size:14px;color:#ffffff;">${fromName}</strong><br/>
                <span style="color:#67a8ff;font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Engineered shade. Exceptional spaces.</span><br/>
                Cape Town, Western Cape
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #31435d;">
            <tr>
              <td class="footer-stack" valign="top" style="padding-top:17px;font-size:11px;color:#b9c7d8;line-height:1.8;">
                <strong style="color:#ffffff;">${senderName}</strong> · ${senderRole}<br/>
                <a href="tel:${senderPhoneHref}" style="color:#ffffff;text-decoration:none;font-weight:700;">${senderPhone}</a><br/>
                <a href="mailto:${senderEmail}" style="color:#67a8ff;text-decoration:none;">${senderEmail}</a>
              </td>
              <td class="footer-stack footer-actions" align="right" valign="top" style="padding-top:17px;font-size:11px;line-height:1.8;">
                <a href="https://eliteshadesolutions.co.za" target="_blank" style="color:#67a8ff;text-decoration:none;">eliteshadesolutions.co.za</a><br/>
                <a href="https://eliteshadesolutions.co.za/quote" target="_blank" class="footer-button" style="display:inline-block;margin-top:6px;padding:8px 13px;background:#1769e0;border-radius:6px;color:#ffffff;text-decoration:none;font-weight:800;">Get an instant estimate →</a>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #31435d;font-size:9px;line-height:1.55;color:#71839a;">This message was sent by Elite Shade Solutions regarding an enquiry, quote, invoice or project update. If it reached you in error, please reply and let us know.</p>
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
  const configuredSalesPhone = db.settings.sales_phone?.trim() || "";
  const salesPhone = !configuredSalesPhone || configuredSalesPhone.replace(/\D/g, "") === "0676182422"
    ? "071 581 4268"
    : configuredSalesPhone;
  const html = buildHtml(subject, body, fromName, from, {
    salesName: db.settings.sales_name || "Jean-Pierre Miller",
    salesPhone,
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

export interface HtmlEmailOptions {
  from?: string;
  replyTo?: string;
  attachment?: {
    filename: string;
    path: string;
  };
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  options: HtmlEmailOptions = {}
): Promise<EmailLog> {
  const db = await getDB();
  const key = envString("ELITE_RESEND_API_KEY") || db.settings.resend_api_key?.trim();
  const from = options.from?.trim() || "sales@eliteshadesolutions.co.za";
  const replyTo = options.replyTo?.trim() || from;
  const fromName = db.settings.company_name || "Elite Shade Solutions";
  const smtpHost = envString("ELITE_SMTP_HOST") || db.settings.smtp_host || "";
  const smtpPort = envNumber("ELITE_SMTP_PORT") || db.settings.smtp_port || 587;
  const smtpUser = envString("ELITE_SMTP_USER") || db.settings.smtp_user || "";
  const smtpPass = envString("ELITE_SMTP_PASS") || db.settings.smtp_pass || "";
  const smtpSecure = envBool("ELITE_SMTP_SECURE") ?? !!db.settings.smtp_secure;
  const envProvider = envString("ELITE_EMAIL_PROVIDER");
  const provider = (envProvider === "smtp" || envProvider === "resend" || envProvider === "outbox")
    ? envProvider
    : (db.settings.email_provider || (key ? "resend" : "outbox"));
  const text = htmlToText(html);
  const attachment = options.attachment;
  let channel: EmailLog["channel"] = "outbox";
  let status: EmailLog["status"] = "queued";
  let error = "";

  if (provider === "smtp" && smtpHost && smtpUser) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: `${fromName} <${from}>`,
        replyTo,
        to,
        subject,
        text,
        html,
        attachments: attachment ? [{ filename: attachment.filename, path: attachment.path, contentType: "application/pdf" }] : undefined,
      });
      channel = "smtp";
      status = "sent";
    } catch (caught) {
      channel = "smtp";
      status = "failed";
      error = caught instanceof Error ? caught.message : "SMTP delivery failed";
    }
  } else if (provider === "resend" && key) {
    try {
      const attachments = attachment
        ? [{ filename: attachment.filename, content: (await fs.readFile(attachment.path)).toString("base64") }]
        : undefined;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${fromName} <${from}>`, reply_to: replyTo, to, subject, text, html, attachments }),
      });
      channel = "resend";
      status = res.ok ? "sent" : "failed";
      if (!res.ok) error = `Email provider returned ${res.status}`;
    } catch (caught) {
      channel = "resend";
      status = "failed";
      error = caught instanceof Error ? caught.message : "Email delivery failed";
    }
  }

  return mutate((d) => {
    const log: EmailLog = {
      id: uid("eml_"),
      to,
      subject,
      body: text,
      html,
      sent_at: new Date().toISOString(),
      channel,
      status,
      ...(error ? { error } : {}),
    };
    d.emails.unshift(log);
    return log;
  });
}
