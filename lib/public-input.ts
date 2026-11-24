const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function cleanPublicText(value: unknown, maxLength = 160) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function cleanPublicMessage(value: unknown, maxLength = 2_000) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

export function cleanPublicEmail(value: unknown) {
  return cleanPublicText(value, 254).toLowerCase();
}

export function isValidPublicEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}
