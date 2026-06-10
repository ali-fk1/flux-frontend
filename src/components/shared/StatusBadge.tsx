import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { formatPostStatus } from "@/types/post";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium font-mono uppercase tracking-wide",
  {
    variants: {
      status: {
        draft: "bg-muted text-muted-foreground",
        scheduled: "bg-primary/15 text-primary",
        processing: "bg-secondary text-secondary-foreground",
        publishing: "bg-accent/15 text-accent-foreground",
        published: "bg-primary/10 text-primary",
        failed: "bg-destructive/15 text-destructive",
        cancelled: "bg-muted text-muted-foreground",
        deleted: "bg-muted text-muted-foreground line-through",
      },
    },
    defaultVariants: {
      status: "scheduled",
    },
  }
);

type KnownStatus = NonNullable<VariantProps<typeof statusBadgeVariants>["status"]>;

function normalizeStatus(status: string): KnownStatus {
  const normalized = status.toLowerCase();
  const known: KnownStatus[] = [
    "draft",
    "scheduled",
    "processing",
    "publishing",
    "published",
    "failed",
    "cancelled",
    "deleted",
  ];
  if (known.includes(normalized as KnownStatus)) {
    return normalized as KnownStatus;
  }
  if (normalized === "posted") return "published";
  return "scheduled";
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = normalizeStatus(status);
  return (
    <span className={cn(statusBadgeVariants({ status: variant }), className)}>
      {formatPostStatus(variant)}
    </span>
  );
}
