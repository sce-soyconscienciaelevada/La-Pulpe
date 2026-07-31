// Single source of truth for "what day is it at the bar".
//
// The bug this exists to prevent (found 2026-07-31, already in live data):
// `new Date(); d.setHours(0,0,0,0)` gives midnight in the *server's* timezone.
// Locally that is Cordoba, but Vercel's runtime is UTC — so production rolled
// the business day at 00:00 UTC, which is 21:00 in Cordoba, right in the middle
// of service. Four duplicate BusinessDay rows already existed for the same real
// day (one at 03:00Z from a UTC-3 machine, one at 00:00Z from Vercel), and
// `@@unique([venueId, date])` could not catch it because the timestamps differ.
//
// Canonical form: a day is stored as the UTC instant of *Cordoba* midnight
// (e.g. 2026-07-31T03:00:00Z). That representation is safe to read back with
// plain `getDate()` / `getDay()` / `toISOString().slice(0,10)` under BOTH a UTC
// server and a UTC-3 laptop, because Cordoba is UTC-3 with no DST, so local
// midnight always lands at 03:00Z on the same calendar date.
//
// Pure functions only — no Prisma import, so Client Components can use this.

export const VENUE_TZ = "America/Argentina/Cordoba";

/** Milliseconds to add to a UTC instant to get the wall-clock time in `timeZone`. */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return instant.getTime() - asIfUtc;
}

/** Midnight of the calendar day `instant` falls on *in `timeZone`*, as a UTC instant. */
export function startOfDayInTz(instant: Date, timeZone: string = VENUE_TZ): Date {
  // Calendar date as seen in the venue's timezone. "en-CA" yields YYYY-MM-DD.
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(instant)
    .split("-")
    .map(Number);

  const utcGuess = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  return new Date(utcGuess + tzOffsetMs(new Date(utcGuess), timeZone));
}

/** Today at the bar, as a UTC instant representing Cordoba midnight. */
export function todayInTz(timeZone: string = VENUE_TZ): Date {
  return startOfDayInTz(new Date(), timeZone);
}
