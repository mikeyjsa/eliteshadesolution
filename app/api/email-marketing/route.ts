import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getDB, mutate, uid } from "@/lib/db";
import { sendHtmlEmail } from "@/lib/email";
import { EMAIL_ATTACHMENTS_DIR } from "@/lib/storage-paths";
import { promises as fs } from "fs";
import path from "path";
import type {
  EmailCampaign,
  EmailCampaignRecipient,
  EmailCampaignSend,
  MailingContact,
  MailingList,
} from "@/lib/types";

const MAILER_FROM = "sales@eliteshadesolutions.co.za";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function cleanHeader(value: unknown) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function personalize(value: string, name: string, html = false) {
  const replacement = html ? escapeHtml(name) : cleanHeader(name);
  return value.replace(/\{\{name\}\}/gi, replacement).replace(/\{name\}/gi, replacement);
}

function allowedReplyTo(requested: unknown, salesEmail: string, infoEmail: string) {
  const value = cleanHeader(requested).toLowerCase();
  return value === infoEmail.toLowerCase() ? infoEmail : salesEmail;
}

function normaliseContacts(value: unknown): MailingContact[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    const email = cleanHeader(entry?.email).toLowerCase();
    if (!EMAIL_PATTERN.test(email) || seen.has(email)) return [];
    seen.add(email);
    return [{ id: cleanHeader(entry?.id) || uid("mlc_"), name: cleanHeader(entry?.name), email }];
  });
}

function attachmentPath(url?: string) {
  if (!url?.startsWith("/uploads/email-marketing/")) return null;
  const filename = path.basename(url);
  return path.join(EMAIL_ATTACHMENTS_DIR, filename);
}

function campaignAttachment(campaign: EmailCampaign) {
  const filePath = attachmentPath(campaign.attachment_url);
  if (!filePath || !campaign.attachment_name) return undefined;
  return { filename: campaign.attachment_name, path: filePath };
}

async function savePdf(dataUrl: unknown, originalName: unknown) {
  if (typeof dataUrl !== "string" || !dataUrl) return null;
  const match = dataUrl.match(/^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Only PDF attachments are allowed.");
  const bytes = Buffer.from(match[1], "base64");
  if (!bytes.length || bytes.length > MAX_PDF_BYTES) throw new Error("PDF attachments must be 10 MB or smaller.");
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("The selected file is not a valid PDF.");
  const displayBase = cleanHeader(originalName).replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9 _.-]/g, "").slice(0, 100) || "campaign-attachment";
  const displayName = `${displayBase}.pdf`;
  const storedName = `${uid("mailer_")}.pdf`;
  await fs.mkdir(EMAIL_ATTACHMENTS_DIR, { recursive: true });
  await fs.writeFile(path.join(EMAIL_ATTACHMENTS_DIR, storedName), bytes);
  return { url: `/uploads/email-marketing/${storedName}`, name: displayName };
}

async function requireUser() {
  return currentUser();
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const db = await getDB();
  return NextResponse.json({
    lists: db.mailing_lists,
    campaigns: db.email_campaigns,
    sends: db.email_campaign_sends,
  });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const action = cleanHeader(body.action);
  const db = await getDB();
  const salesEmail = db.settings.sales_email?.trim() || MAILER_FROM;
  const infoEmail = db.settings.info_email?.trim() || "info@eliteshadesolutions.co.za";

  if (action === "save_list") {
    const name = cleanHeader(body.name);
    const contacts = normaliseContacts(body.contacts);
    if (!name) return NextResponse.json({ error: "List name is required." }, { status: 400 });
    if (!contacts.length) return NextResponse.json({ error: "Add at least one valid email address." }, { status: 400 });

    const list = await mutate((data) => {
      const now = new Date().toISOString();
      const existing = data.mailing_lists.find((item) => item.id === body.id);
      if (existing) {
        existing.name = name;
        existing.contacts = contacts;
        existing.updated_at = now;
        return existing;
      }
      const next: MailingList = { id: uid("ml_"), name, contacts, created_at: now, updated_at: now };
      data.mailing_lists.unshift(next);
      return next;
    });
    return NextResponse.json({ ok: true, list });
  }

  if (action === "save_campaign") {
    const name = cleanHeader(body.name);
    const subject = cleanHeader(body.subject);
    const html = String(body.html || "").trim();
    if (!name || !subject || !html) {
      return NextResponse.json({ error: "Campaign name, subject and HTML are required." }, { status: 400 });
    }
    const replyTo = allowedReplyTo(body.reply_to, salesEmail, infoEmail);
    const previous = db.email_campaigns.find((item) => item.id === body.id);
    const previousAttachmentUrl = previous?.attachment_url;
    let uploaded: Awaited<ReturnType<typeof savePdf>>;
    try {
      uploaded = await savePdf(body.attachment_data_url, body.attachment_name);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save PDF attachment." }, { status: 400 });
    }
    const removeAttachment = body.remove_attachment === true;
    const nextAttachmentUrl = uploaded?.url ?? (removeAttachment ? undefined : previous?.attachment_url);
    const nextAttachmentName = uploaded?.name ?? (removeAttachment ? undefined : previous?.attachment_name);
    const listId = cleanHeader(body.list_id);
    const validListId = db.mailing_lists.some((item) => item.id === listId) ? listId : undefined;
    const campaign = await mutate((data) => {
      const now = new Date().toISOString();
      const existing = data.email_campaigns.find((item) => item.id === body.id);
      if (existing) {
        Object.assign(existing, {
          name,
          subject,
          html,
          reply_to: replyTo,
          list_id: validListId,
          attachment_url: nextAttachmentUrl,
          attachment_name: nextAttachmentName,
          updated_at: now,
        });
        return existing;
      }
      const next: EmailCampaign = {
        id: uid("cmp_"),
        name,
        subject,
        html,
        reply_to: replyTo,
        list_id: validListId,
        attachment_url: nextAttachmentUrl,
        attachment_name: nextAttachmentName,
        created_at: now,
        updated_at: now,
      };
      data.email_campaigns.unshift(next);
      return next;
    });
    if ((uploaded || removeAttachment) && previousAttachmentUrl && previousAttachmentUrl !== nextAttachmentUrl) {
      const oldPath = attachmentPath(previousAttachmentUrl);
      if (oldPath) await fs.unlink(oldPath).catch(() => {});
    }
    return NextResponse.json({ ok: true, campaign });
  }

  if (action === "test_campaign") {
    const campaign = db.email_campaigns.find((item) => item.id === body.campaign_id);
    const to = cleanHeader(body.to).toLowerCase();
    if (!campaign) return NextResponse.json({ error: "Save the campaign before testing it." }, { status: 404 });
    if (!EMAIL_PATTERN.test(to)) return NextResponse.json({ error: "Enter a valid test email address." }, { status: 400 });
    const name = cleanHeader(body.name) || user.name || "Test Recipient";
    const attachment = campaignAttachment(campaign);
    if (campaign.attachment_url && !attachment) {
      return NextResponse.json({ error: "The campaign PDF attachment is unavailable. Upload it again before sending." }, { status: 400 });
    }
    const log = await sendHtmlEmail(
      to,
      `[TEST] ${personalize(campaign.subject, name)}`,
      personalize(campaign.html, name, true),
      { from: MAILER_FROM, replyTo: allowedReplyTo(campaign.reply_to, salesEmail, infoEmail), attachment }
    );
    return NextResponse.json({ ok: log.status !== "failed", status: log.status, error: log.error });
  }

  if (action === "send_campaign") {
    const campaign = db.email_campaigns.find((item) => item.id === body.campaign_id);
    const list = db.mailing_lists.find((item) => item.id === body.list_id);
    if (!campaign || !list) return NextResponse.json({ error: "Choose a saved campaign and recipient list." }, { status: 404 });
    if (!list.contacts.length) return NextResponse.json({ error: "The selected list is empty." }, { status: 400 });
    const replyTo = allowedReplyTo(campaign.reply_to, salesEmail, infoEmail);
    const attachment = campaignAttachment(campaign);
    if (campaign.attachment_url && !attachment) {
      return NextResponse.json({ error: "The campaign PDF attachment is unavailable. Upload it again before sending." }, { status: 400 });
    }
    await mutate((data) => {
      const savedCampaign = data.email_campaigns.find((item) => item.id === campaign.id);
      if (savedCampaign) {
        savedCampaign.list_id = list.id;
        savedCampaign.updated_at = new Date().toISOString();
      }
    });
    const report: EmailCampaignSend = {
      id: uid("send_"),
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      list_id: list.id,
      list_name: list.name,
      subject: campaign.subject,
      from: MAILER_FROM,
      reply_to: replyTo,
      attachment_name: campaign.attachment_name,
      status: "sending",
      total: list.contacts.length,
      sent: 0,
      queued: 0,
      failed: 0,
      started_at: new Date().toISOString(),
      recipients: [],
    };
    await mutate((data) => data.email_campaign_sends.unshift(report));

    for (const contact of list.contacts) {
      const log = await sendHtmlEmail(
        contact.email,
        personalize(campaign.subject, contact.name),
        personalize(campaign.html, contact.name, true),
        { from: MAILER_FROM, replyTo, attachment }
      );
      const recipient: EmailCampaignRecipient = {
        name: contact.name,
        email: contact.email,
        status: log.status,
        sent_at: log.sent_at,
        ...(log.error ? { error: log.error } : {}),
      };
      await mutate((data) => {
        const current = data.email_campaign_sends.find((item) => item.id === report.id);
        if (!current) return;
        current.recipients.push(recipient);
        current[log.status] += 1;
      });
    }

    const completed = await mutate((data) => {
      const current = data.email_campaign_sends.find((item) => item.id === report.id)!;
      current.completed_at = new Date().toISOString();
      current.status = current.failed === current.total ? "failed" : current.failed > 0 ? "partial" : "completed";
      return current;
    });
    return NextResponse.json({ ok: completed.failed === 0, report: completed });
  }

  return NextResponse.json({ error: "Unknown email marketing action." }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json();
  const type = cleanHeader(body.type);
  const id = cleanHeader(body.id);
  if (!id || (type !== "list" && type !== "campaign")) {
    return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });
  }
  let attachmentToDelete: string | null = null;
  await mutate((db) => {
    if (type === "list") db.mailing_lists = db.mailing_lists.filter((item) => item.id !== id);
    if (type === "campaign") {
      const campaign = db.email_campaigns.find((item) => item.id === id);
      attachmentToDelete = attachmentPath(campaign?.attachment_url);
      db.email_campaigns = db.email_campaigns.filter((item) => item.id !== id);
    }
  });
  if (attachmentToDelete) await fs.unlink(attachmentToDelete).catch(() => {});
  return NextResponse.json({ ok: true });
}
