import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(to)) {
    return NextResponse.json({ error: "Enter a valid test email address." }, { status: 400 });
  }

  const log = await sendEmail(
    to,
    "Elite Shade Solutions email delivery test",
    "This test confirms that the live Elite Shade Solutions website can deliver email through the configured provider."
  );
  if (log.status !== "sent") {
    return NextResponse.json(
      { error: log.error || (log.status === "queued" ? "Email was queued instead of sent." : "Email delivery failed.") },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, channel: log.channel });
}
