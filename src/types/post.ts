export const POST_STATUSES = [
  "draft",
  "scheduled",
  "processing",
  "publishing",
  "published",
  "failed",
  "cancelled",
  "deleted",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export function isPostStatus(value: string): value is PostStatus {
  return (POST_STATUSES as readonly string[]).includes(value);
}

export function formatPostStatus(status: string): string {
  if (isPostStatus(status)) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  return status;
}
