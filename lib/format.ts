export function zar(n: number): string {
  return "R " + Math.round(n).toLocaleString("en-ZA");
}

export function zarShort(n: number): string {
  if (n >= 1_000_000) return "R" + (n / 1_000_000).toFixed(2) + "m";
  if (n >= 1000) return "R" + (n / 1000).toFixed(1) + "k";
  return "R" + Math.round(n);
}

export function dateZA(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
