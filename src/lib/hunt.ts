export type HuntStatus = "NOT_CONFIGURED" | "NOT_STARTED" | "LIVE" | "ENDED";

/** Determine the hunt window status for a college at `now`. */
export function getHuntStatus(
  huntStartAt: Date | null,
  huntEndAt: Date | null,
  now: Date = new Date(),
): HuntStatus {
  if (!huntStartAt && !huntEndAt) return "NOT_CONFIGURED";
  if (huntStartAt && now < huntStartAt) return "NOT_STARTED";
  if (huntEndAt && now > huntEndAt) return "ENDED";
  return "LIVE";
}
