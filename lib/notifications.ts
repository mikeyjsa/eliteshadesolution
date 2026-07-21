import { uid } from "./db";
import type { AdminNotification, DB } from "./types";

type NotificationInput = Omit<AdminNotification, "id" | "created_at" | "read_at"> & {
  created_at?: string;
  read_at?: string | null;
};

export function pushAdminNotification(db: DB, input: NotificationInput): AdminNotification {
  const notification: AdminNotification = {
    id: uid("ntf_"),
    title: input.title,
    message: input.message,
    href: input.href,
    kind: input.kind,
    quote_id: input.quote_id,
    read_at: input.read_at ?? null,
    created_at: input.created_at ?? new Date().toISOString(),
  };
  db.notifications.unshift(notification);
  db.notifications = db.notifications.slice(0, 250);
  return notification;
}
