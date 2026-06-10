import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Zap, Clock, ArrowRight, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { login as keycloakLogin, register as keycloakRegister } from "@/lib/keycloak";
import { useAuth } from "@/contexts/AuthContext";
import { FluxLogo } from "@/components/shared/FluxLogo";
import { Separator } from "@/components/ui/separator";

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: "Smart scheduling",
      description:
        "Set publish times in your timezone and let Flux handle the rest.",
    },
    {
      icon: Zap,
      title: "Workflow canvas",
      description:
        "See every post in one place — draft, scheduled, and published.",
    },
    {
      icon: Clock,
      title: "Post on time",
      description:
        "Reliable delivery so your content goes live when it should.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <FluxLogo size="lg" />

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`}
                        alt={user?.email || "User"}
                      />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => keycloakLogin()}>
                  Log in
                </Button>
                <Button onClick={() => keycloakRegister()}>
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6">
        <section className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Schedule smarter.
            <br />
            Post on time.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Flux helps you plan, schedule, and publish social content from a
            single focused dashboard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => keycloakRegister()}>
              Start scheduling
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => keycloakLogin()}
            >
              Log in
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-2xl py-8">
          <Separator />
          <p className="py-6 text-center text-sm text-muted-foreground">
            Currently supported
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2">
              X (Twitter)
            </span>
          </div>
          <Separator className="mt-8" />
        </section>

        <section className="mx-auto max-w-4xl pb-20 pt-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
