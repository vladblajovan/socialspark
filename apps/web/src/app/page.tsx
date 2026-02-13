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
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Write once.{" "}
          <span className="text-primary">Publish everywhere.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          The AI-native social media platform for creators and small teams.
          Create content once, let AI adapt it for every platform, and schedule
          it all from one place.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Everything you need to grow your audience
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SocialSpark. All rights reserved.
      </footer>
    </div>
  );
}
