// Branded invoice PDF via pdf-lib (per workspace convention — not @react-pdf).
// White header, large logo, alternating row shading, full address block.
import { promises as fs } from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import type { Invoice, Quote, Customer, Settings } from "./types";
import { zar } from "./format";
import { eftDetails, gatewayEnabled } from "./site";

const NAVY   = rgb(0.157, 0.216, 0.275);   // #283746
const BRASS  = rgb(0.788, 0.635, 0.294);   // #c9a24b
const INK    = rgb(0.133, 0.188, 0.235);   // #22303c
const GREY   = rgb(0.357, 0.420, 0.478);   // #5b6b7a
const LINE   = rgb(0.840, 0.867, 0.886);   // #d6dde2
const ROW_A  = rgb(1, 1, 1);               // white rows
const ROW_B  = rgb(0.960, 0.970, 0.975);  // very light grey alt rows
const SIG    = rgb(0.247, 0.561, 0.373);   // #3f8f5f signal green
const PAGE_PAD = 40;
const TABLE_X = 40;
const TABLE_W = 595 - 80;
const AMOUNT_COL_W = 110;

let logoCache: Uint8Array | null = null;
async function loadLogo(): Promise<Uint8Array | null> {
  if (logoCache) return logoCache;
  try {
    logoCache = await fs.readFile(path.join(process.cwd(), "public", "logo.png"));
    return logoCache;
  } catch { return null; }
}

// Customer-facing quote number, stable per quote.
export function quoteNumber(quote: Quote): string {
  return "Q-" + quote.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
}

export async function invoicePDF(
  invoice: Invoice,
  quote: Quote,
  customer: Customer,
  settings: Settings,
  payUrl?: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  const t = (s: string, x: number, y: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x, y, size, font: f, color });
  const textWidth = (s: string, size: number, f = font) => f.widthOfTextAtSize(s, size);
  const rightText = (s: string, rightX: number, y: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x: rightX - textWidth(s, size, f), y, size, font: f, color });
  const wrapText = (s: string, maxWidth: number, size: number, f = font) => {
    const words = s.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, size, f) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (textWidth(word, size, f) <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = "";
      for (const ch of word) {
        const chunkCandidate = chunk + ch;
        if (textWidth(chunkCandidate, size, f) <= maxWidth) {
          chunk = chunkCandidate;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const drawWrapped = (s: string, x: number, topY: number, maxWidth: number, size = 10, f = font, color = INK, lineGap = 3) => {
    const lines = wrapText(s, maxWidth, size, f);
    let y = topY;
    const step = size + lineGap;
    lines.forEach((line) => {
      t(line, x, y, size, f, color);
      y -= step;
    });
    return { lines, bottomY: y + step };
  };

  // ── WHITE HEADER BAND with logo ──────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 750, width, height: 92, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: 0, y: 750 }, end: { x: width, y: 750 }, thickness: 1, color: LINE });

  // Logo (large, left-aligned)
  let logoEmbedded = false;
  const logoBytes = await loadLogo();
  if (logoBytes) {
    try {
      const logo: PDFImage = await doc.embedPng(logoBytes);
      const logoH = 72;
      const logoW = (logo.width / logo.height) * logoH;
      page.drawImage(logo, { x: 32, y: 763, width: logoW, height: logoH });
      logoEmbedded = true;
    } catch { /* fallback below */ }
  }
  if (!logoEmbedded) {
    t("ELITE SHADE SOLUTIONS", 32, 806, 15, bold, NAVY);
    t("ENGINEERED SHADE. EXCEPTIONAL SPACES.", 32, 788, 7, font, BRASS);
  }

  // Invoice type & number — right side of header
  const invLabel = invoice.type === "deposit" ? "DEPOSIT INVOICE" : "BALANCE INVOICE";
  t(invLabel, width - 220, 812, 14, bold, NAVY);
  t("No. " + invoice.number, width - 220, 793, 9, font, GREY);

  // Status pill
  const pillW = 68;
  page.drawRectangle({ x: width - 220, y: 758, width: pillW, height: 22,
    color: invoice.status === "paid" ? rgb(0.87, 0.96, 0.91) : rgb(0.96, 0.91, 0.83),
  });
  t(invoice.status.toUpperCase(), width - 220 + 9, 766, 9, bold,
    invoice.status === "paid" ? SIG : BRASS
  );

  // ── NAVY ACCENT STRIPE ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 742, width, height: 8, color: NAVY });

  // ── BILL TO / DETAILS BLOCK ─────────────────────────────────────────────
  let y = 712;
  t("BILL TO", 40, y, 8, bold, GREY);
  const billX = 40;
  const billW = 275;
  let billTop = y - 16;
  t(customer.name, billX, billTop, 12, bold, INK);
  billTop -= 18;
  const emailBlock = drawWrapped(customer.email, billX, billTop, billW, 9, font, GREY);
  billTop = emailBlock.bottomY - 13;
  const phoneLine = `${customer.phone || "—"} · ${customer.suburb || ""}`;
  const phoneBlock = drawWrapped(phoneLine, billX, billTop, billW, 9, font, GREY);
  billTop = phoneBlock.bottomY - 13;
  let billBottom = phoneBlock.bottomY;
  if (customer.address) {
    const addressBlock = drawWrapped(customer.address, billX, billTop, billW, 9, font, GREY);
    billBottom = addressBlock.bottomY;
  }

  // Issued / status right column
  const rcX = width - 220;
  const row = (label: string, value: string, vy: number) => {
    t(label, rcX, vy, 8, bold, GREY);
    const block = drawWrapped(value, rcX, vy - 14, 180, 10, font, INK);
    return block.bottomY;
  };
  const issuedBottom = row("ISSUED", new Date(invoice.issued_at).toLocaleDateString("en-ZA"), y);
  const sizeBottom = row("PROJECT SIZE", `${quote.inputs.length}m × ${quote.inputs.width}m`, y - 38);
  const colourBottom = row("COLOUR", quote.inputs.colour || "—", y - 76);
  let rightBottom = Math.min(issuedBottom, sizeBottom, colourBottom);
  if (invoice.payfast_id) {
    t("PayFast: " + invoice.payfast_id, rcX, y - 100, 8, font, GREY);
    rightBottom = Math.min(rightBottom, y - 100);
  }

  // ── LINE ITEMS TABLE ─────────────────────────────────────────────────────
  y = Math.min(636, Math.min(billBottom, rightBottom) - 30);

  // Header row
  page.drawRectangle({ x: TABLE_X, y: y - 6, width: TABLE_W, height: 24, color: NAVY });
  t("DESCRIPTION", 50, y + 2, 9, bold, rgb(1, 1, 1));
  rightText("AMOUNT", width - PAGE_PAD - 12, y + 2, 9, bold, rgb(1, 1, 1));
  y -= 28;

  const items = quote.final_line_items ?? quote.line_items;
  for (let i = 0; i < items.length; i++) {
    const li = items[i];
    const rowColor = i % 2 === 0 ? ROW_A : ROW_B;
    const labelLines = wrapText(li.label, TABLE_W - AMOUNT_COL_W - 28, 9.5, font);
    const rowHeight = Math.max(24, 10 + labelLines.length * 13);
    const rowBottom = y - 8;
    page.drawRectangle({ x: TABLE_X, y: rowBottom, width: TABLE_W, height: rowHeight, color: rowColor });
    page.drawLine({ start: { x: TABLE_X, y: rowBottom }, end: { x: width - PAGE_PAD, y: rowBottom }, thickness: 0.4, color: LINE });
    drawWrapped(li.label, 50, y + rowHeight - 18, TABLE_W - AMOUNT_COL_W - 28, 9.5, font, INK);
    rightText(zar(li.amount), width - PAGE_PAD - 12, y + rowHeight / 2 - 2, 9.5, bold, INK);
    y -= rowHeight;
  }

  // Bottom border of last row
  page.drawLine({ start: { x: TABLE_X, y: y + 14 }, end: { x: width - PAGE_PAD, y: y + 14 }, thickness: 1, color: LINE });

  // ── TOTALS BLOCK ─────────────────────────────────────────────────────────
  y -= 14;
  const projectTotal = items.reduce((s, i) => s + i.amount, 0);
  const totX = width - 240;
  const valX = width - PAGE_PAD - 12;

  const totRow = (label: string, val: string, bold_ = false) => {
    t(label, totX, y, 10, bold_ ? bold : font, bold_ ? NAVY : GREY);
    rightText(val, valX, y, 10, bold_ ? bold : font, bold_ ? NAVY : GREY);
    y -= 20;
  };

  totRow("Subtotal (excl VAT)", zar(projectTotal));
  if (settings.vat_enabled) totRow("VAT @ 15%", zar(projectTotal * 0.15));

  y -= 4;
  page.drawLine({ start: { x: totX, y: y + 10 }, end: { x: width - 40, y: y + 10 }, thickness: 1, color: GREY });
  y -= 4;

  // Total due — brass accent
  t(invoice.type === "deposit" ? `DEPOSIT DUE (${settings.deposit_pct}%)` : "BALANCE DUE",
    totX, y, 10, bold, NAVY);
  const dueText = zar(invoice.amount);
  const dueBoxW = Math.max(100, textWidth(dueText, 13, bold) + 24);
  page.drawRectangle({ x: valX - dueBoxW + 8, y: y - 6, width: dueBoxW, height: 22, color: rgb(0.96, 0.91, 0.83) });
  rightText(dueText, valX, y, 13, bold, BRASS);

  // ── HOW TO PAY PANEL (unpaid invoices only) ─────────────────────────────
  if (invoice.status !== "paid") {
    const allowGateway = gatewayEnabled(settings);
    const eftLines = eftDetails(settings).split("\n").map((l) => l.trim()).filter(Boolean);
    const panelH = 66 + eftLines.length * 12 + (payUrl ? 24 : 0);
    const panelTop = Math.min(y - 40, 120 + panelH);
    page.drawRectangle({ x: 40, y: panelTop - panelH + 14, width: width - 80, height: panelH, color: rgb(0.953, 0.918, 0.831) });
    page.drawRectangle({ x: 40, y: panelTop - panelH + 14, width: 4, height: panelH, color: BRASS });
    let py = panelTop;
    t("HOW TO PAY", 56, py, 9, bold, NAVY);
    py -= 16;
    if (allowGateway && payUrl) {
      t("1.  PayFast (card / instant EFT) — pay securely online:", 56, py, 9, font, INK);
      py -= 13;
      t(payUrl, 72, py, 9, bold, NAVY);
      py -= 16;
      t("2.  Direct EFT:", 56, py, 9, font, INK);
    } else {
      t("Direct EFT:", 56, py, 9, font, INK);
    }
    py -= 13;
    for (const line of eftLines) {
      t(line, 72, py, 9, font, GREY);
      py -= 12;
    }
    t("Reference: " + invoice.number, 72, py, 9, bold, NAVY);
  }

  // ── COMPANY FOOTER BAND ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 72, color: NAVY });
  t(settings.company_name + " · " + (settings.company_address || "Cape Town, Western Cape"),
    40, 50, 8, font, rgb(0.75, 0.82, 0.87));
  t("Jean-Pierre Miller · Sales · 067 618 2422", 40, 34, 8, font, rgb(0.6, 0.68, 0.75));
  t("Michael Theron · Marketing / Online sales · 060 949 1197", 40, 20, 8, font, rgb(0.6, 0.68, 0.75));
  if (settings.vat_enabled) {
    t("VAT Reg: " + settings.vat_number, width - 170, 50, 8, font, rgb(0.75, 0.82, 0.87));
  }
  t(settings.email_from || "sales@eliteshadesolutions.co.za", width - 230, 34, 8, font, rgb(0.6, 0.68, 0.75));
  t("info@eliteshadesolutions.co.za", width - 230, 20, 8, font, rgb(0.6, 0.68, 0.75));

  return doc.save();
}

// ── QUOTATION PDF ──────────────────────────────────────────────────────────
// Same visual language as the invoice: white header + logo, navy stripe,
// alternating row table, brass total box, plus an "accept online" panel.
export async function quotePDF(
  quote: Quote,
  customer: Customer,
  settings: Settings,
  acceptUrl: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  const t = (s: string, x: number, y: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x, y, size, font: f, color });
  const textWidth = (s: string, size: number, f = font) => f.widthOfTextAtSize(s, size);
  const rightText = (s: string, rightX: number, y: number, size = 10, f = font, color = INK) =>
    page.drawText(s, { x: rightX - textWidth(s, size, f), y, size, font: f, color });
  const wrapText = (s: string, maxWidth: number, size: number, f = font) => {
    const words = s.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, size, f) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      line = word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const drawWrapped = (s: string, x: number, topY: number, maxWidth: number, size = 10, f = font, color = INK, lineGap = 3) => {
    const lines = wrapText(s, maxWidth, size, f);
    let y = topY;
    lines.forEach((line) => { t(line, x, y, size, f, color); y -= size + lineGap; });
    return { lines, bottomY: y + size + lineGap };
  };

  // ── WHITE HEADER BAND with logo ──────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 750, width, height: 92, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: 0, y: 750 }, end: { x: width, y: 750 }, thickness: 1, color: LINE });
  let logoEmbedded = false;
  const logoBytes = await loadLogo();
  if (logoBytes) {
    try {
      const logo: PDFImage = await doc.embedPng(logoBytes);
      const logoH = 72;
      const logoW = (logo.width / logo.height) * logoH;
      page.drawImage(logo, { x: 32, y: 763, width: logoW, height: logoH });
      logoEmbedded = true;
    } catch { /* fallback below */ }
  }
  if (!logoEmbedded) {
    t("ELITE SHADE SOLUTIONS", 32, 806, 15, bold, NAVY);
    t("ENGINEERED SHADE. EXCEPTIONAL SPACES.", 32, 788, 7, font, BRASS);
  }

  t("QUOTATION", width - 220, 812, 14, bold, NAVY);
  t("No. " + quoteNumber(quote), width - 220, 793, 9, font, GREY);
  const accepted = Boolean(quote.accepted_at);
  const pillText = accepted ? "ACCEPTED" : "AWAITING ACCEPTANCE";
  const pillW = textWidth(pillText, 8, bold) + 18;
  page.drawRectangle({ x: width - 220, y: 758, width: pillW, height: 22,
    color: accepted ? rgb(0.87, 0.96, 0.91) : rgb(0.96, 0.91, 0.83) });
  t(pillText, width - 220 + 9, 766, 8, bold, accepted ? SIG : BRASS);

  // ── NAVY ACCENT STRIPE ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 742, width, height: 8, color: NAVY });

  // ── PREPARED FOR / DETAILS ──────────────────────────────────────────────
  let y = 712;
  t("PREPARED FOR", 40, y, 8, bold, GREY);
  let billTop = y - 16;
  t(customer.name, 40, billTop, 12, bold, INK);
  billTop -= 18;
  const emailBlock = drawWrapped(customer.email, 40, billTop, 275, 9, font, GREY);
  billTop = emailBlock.bottomY - 13;
  const phoneBlock = drawWrapped(`${customer.phone || "—"} · ${customer.suburb || ""}`, 40, billTop, 275, 9, font, GREY);
  let billBottom = phoneBlock.bottomY;
  if (customer.address) {
    const addressBlock = drawWrapped(customer.address, 40, phoneBlock.bottomY - 13, 275, 9, font, GREY);
    billBottom = addressBlock.bottomY;
  }

  const rcX = width - 220;
  const row = (label: string, value: string, vy: number) => {
    t(label, rcX, vy, 8, bold, GREY);
    return drawWrapped(value, rcX, vy - 14, 180, 10, font, INK).bottomY;
  };
  const issued = new Date(quote.updated_at || quote.created_at);
  const validUntil = new Date(issued.getTime() + 14 * 24 * 3600 * 1000);
  const d1 = row("DATE", issued.toLocaleDateString("en-ZA"), y);
  const d2 = row("VALID UNTIL", validUntil.toLocaleDateString("en-ZA"), y - 38);
  const hasSize = quote.net_label !== "Contact form enquiry" && quote.inputs.length > 0;
  const d3 = hasSize ? row("PROJECT SIZE", `${quote.inputs.length}m × ${quote.inputs.width}m · ${quote.inputs.colour}`, y - 76) : y - 76;

  // ── LINE ITEMS TABLE ─────────────────────────────────────────────────────
  y = Math.min(636, Math.min(billBottom, d1, d2, d3) - 30);
  page.drawRectangle({ x: TABLE_X, y: y - 6, width: TABLE_W, height: 24, color: NAVY });
  t("DESCRIPTION", 50, y + 2, 9, bold, rgb(1, 1, 1));
  rightText("AMOUNT", width - PAGE_PAD - 12, y + 2, 9, bold, rgb(1, 1, 1));
  y -= 28;

  const items = quote.final_line_items ?? quote.line_items;
  for (let i = 0; i < items.length; i++) {
    const li = items[i];
    const labelLines = wrapText(li.label, TABLE_W - AMOUNT_COL_W - 28, 9.5, font);
    const rowHeight = Math.max(24, 10 + labelLines.length * 13);
    const rowBottom = y - 8;
    page.drawRectangle({ x: TABLE_X, y: rowBottom, width: TABLE_W, height: rowHeight, color: i % 2 === 0 ? ROW_A : ROW_B });
    page.drawLine({ start: { x: TABLE_X, y: rowBottom }, end: { x: width - PAGE_PAD, y: rowBottom }, thickness: 0.4, color: LINE });
    drawWrapped(li.label, 50, y + rowHeight - 18, TABLE_W - AMOUNT_COL_W - 28, 9.5, font, INK);
    rightText(zar(li.amount), width - PAGE_PAD - 12, y + rowHeight / 2 - 2, 9.5, bold, INK);
    y -= rowHeight;
  }
  page.drawLine({ start: { x: TABLE_X, y: y + 14 }, end: { x: width - PAGE_PAD, y: y + 14 }, thickness: 1, color: LINE });

  // ── TOTALS ───────────────────────────────────────────────────────────────
  y -= 14;
  const projectTotal = quote.final_total ?? items.reduce((s, i) => s + i.amount, 0);
  const totX = width - 240;
  const valX = width - PAGE_PAD - 12;
  const totRow = (label: string, val: string) => {
    t(label, totX, y, 10, font, GREY);
    rightText(val, valX, y, 10, font, GREY);
    y -= 20;
  };
  totRow("Subtotal (excl VAT)", zar(projectTotal));
  if (settings.vat_enabled) totRow("VAT @ 15%", zar(projectTotal * 0.15));
  y -= 4;
  page.drawLine({ start: { x: totX, y: y + 10 }, end: { x: width - 40, y: y + 10 }, thickness: 1, color: GREY });
  y -= 4;
  t("QUOTE TOTAL", totX, y, 10, bold, NAVY);
  const dueText = zar(settings.vat_enabled ? projectTotal * 1.15 : projectTotal);
  const dueBoxW = Math.max(100, textWidth(dueText, 13, bold) + 24);
  page.drawRectangle({ x: valX - dueBoxW + 8, y: y - 6, width: dueBoxW, height: 22, color: rgb(0.96, 0.91, 0.83) });
  rightText(dueText, valX, y, 13, bold, BRASS);
  y -= 24;
  t(`Deposit due on acceptance (${settings.deposit_pct}%)`, totX, y, 9, font, GREY);
  rightText(zar(Math.round(projectTotal * settings.deposit_pct / 100)), valX, y, 9, bold, NAVY);

  // ── ACCEPT PANEL ─────────────────────────────────────────────────────────
  const panelY = Math.min(y - 40, 190);
  page.drawRectangle({ x: 40, y: panelY - 78, width: width - 80, height: 92, color: rgb(0.953, 0.918, 0.831) });
  page.drawRectangle({ x: 40, y: panelY - 78, width: 4, height: 92, color: BRASS });
  t("ACCEPT THIS QUOTE ONLINE", 56, panelY - 6, 9, bold, NAVY);
  drawWrapped(
    "Review and accept at the link below. Once accepted, we email your deposit invoice with secure payment options — PayFast card payment or EFT.",
    56, panelY - 22, width - 130, 9, font, GREY
  );
  drawWrapped(acceptUrl, 56, panelY - 56, width - 130, 9, bold, NAVY);

  // ── FOOTER ───────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 72, color: NAVY });
  t(settings.company_name + " · " + (settings.company_address || "Cape Town, Western Cape"),
    40, 50, 8, font, rgb(0.75, 0.82, 0.87));
  t("Jean-Pierre Miller · Sales · 067 618 2422", 40, 34, 8, font, rgb(0.6, 0.68, 0.75));
  t("Michael Theron · Marketing / Online sales · 060 949 1197", 40, 20, 8, font, rgb(0.6, 0.68, 0.75));
  if (settings.vat_enabled) t("VAT Reg: " + settings.vat_number, width - 170, 50, 8, font, rgb(0.75, 0.82, 0.87));
  t(settings.email_from || "sales@eliteshadesolutions.co.za", width - 230, 34, 8, font, rgb(0.6, 0.68, 0.75));
  t("info@eliteshadesolutions.co.za", width - 230, 20, 8, font, rgb(0.6, 0.68, 0.75));

  return doc.save();
}
