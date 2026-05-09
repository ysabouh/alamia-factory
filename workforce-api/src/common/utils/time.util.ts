/** Parses `HH:mm` (DTO validates); uses UTC-neutral date purely as Postgres TIME carrier. */
export function hhmmToPrismaDate(hm: string): Date {
  const [h, m] = hm.split(":").map((part) => Number.parseInt(part, 10));

  return new Date(Date.UTC(1970, 0, 1, h!, m!, 0, 0));
}

export function prismaDateToHHmm(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");

  return `${h}:${min}`;
}
