import { Twitter, Linkedin, Instagram, Facebook, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConnectXButton from "@/components/ConnectXButton";
import { cn } from "@/lib/utils";

interface PlatformConfig {
  id: string;
  name: string;
  icon: typeof Twitter;
  description: string;
  available: boolean;
}

const platforms: PlatformConfig[] = [
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    description: "Connect your X account to post and schedule content.",
    available: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    description: "Professional networking platform.",
    available: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Photo and video sharing platform.",
    available: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    description: "Social networking platform.",
    available: false,
  },
];

export default function ConnectionsView() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Connect your social accounts to publish and schedule content from Flux.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Card
              key={platform.id}
              className={cn(
                "border-border bg-card",
                !platform.available && "opacity-80"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4 text-foreground" aria-hidden="true" />
                  </div>
                  {!platform.available && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Coming soon
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{platform.name}</CardTitle>
                <CardDescription className="text-sm">
                  {platform.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platform.available ? (
                  <ConnectXButton
                    oauthRoutes={{
                      success: "/auth/success",
                      error: "/auth/error",
                      returnTo: "/dashboard",
                    }}
                    fullWidth
                    variant="default"
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 opacity-0" aria-hidden="true" />
                    <span>Not available yet</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
