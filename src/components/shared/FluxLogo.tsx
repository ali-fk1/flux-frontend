import { cn } from "@/lib/utils";

interface FluxLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export function FluxLogo({ className, size = "md" }: FluxLogoProps) {
  return (
    <span
      className={cn(
        "font-display font-bold tracking-tight text-foreground",
        sizeClasses[size],
        className
      )}
    >
      Flux
      <span className="text-primary" aria-hidden="true">
        .
      </span>
    </span>
  );
}
