import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  Sparkles,
  CalendarClock,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    icon: Share2,
    title: "Multi-Platform Publishing",
    description:
      "Write once, publish to Twitter, LinkedIn, Bluesky, and more — all from a single editor.",
  },
  {
    icon: Sparkles,
    title: "AI Content Adaptation",
    description:
      "Automatically adapts your content for each platform's tone, format, and character limits.",
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    description:
      "Visual calendar, optimal timing suggestions, and reliable publishing — never miss a post.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track engagement, reach, and growth across all your platforms in one unified view.",
  },
];

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.get("better-auth.session_token") ||
    cookieStore.get("__Secure-better-auth.session_token");

  if (hasSession) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="h-5 w-5 text-primary" />
            SocialSpark
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center sm:py-40">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Optimized by AI
        </div>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          Write once.{" "}
          <span className="text-primary">Publish everywhere.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          Create content once, let AI adapt it for every platform, and schedule
          it all from one place. Built for creators and small teams.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button size="lg" asChild className="text-base">
            <Link href="/get-started">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to grow your audience
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              All the tools to manage your social media presence in one place
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50">
                <CardHeader className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Zap className="h-5 w-5 text-primary" />
              SocialSpark
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SocialSpark. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
