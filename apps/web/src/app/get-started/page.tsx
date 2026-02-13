import Link from "next/link";
import {
  Share2,
  Sparkles,
  CalendarClock,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Globe,
  Shield,
  Clock,
  Users,
  PenSquare,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const platforms = [
  { name: "Twitter / X", color: "bg-black text-white" },
  { name: "LinkedIn", color: "bg-blue-700 text-white" },
  { name: "Bluesky", color: "bg-sky-500 text-white" },
  { name: "Instagram", color: "bg-pink-500 text-white" },
  { name: "Facebook", color: "bg-blue-600 text-white" },
  { name: "Threads", color: "bg-gray-800 text-white" },
  { name: "TikTok", color: "bg-gray-900 text-white" },
  { name: "Pinterest", color: "bg-red-600 text-white" },
  { name: "YouTube", color: "bg-red-500 text-white" },
  { name: "Mastodon", color: "bg-purple-600 text-white" },
];

const features = [
  {
    icon: PenSquare,
    title: "Rich Content Editor",
    description:
      "A powerful editor with formatting, media uploads, and real-time character counting per platform. Draft once, fine-tune per channel.",
  },
  {
    icon: Sparkles,
    title: "AI Content Adaptation",
    description:
      "Let AI automatically adapt your content for each platform — adjusting tone, length, hashtags, and formatting to maximize engagement.",
  },
  {
    icon: CalendarClock,
    title: "Visual Calendar & Scheduling",
    description:
      "Plan your entire content calendar with drag-and-drop scheduling. See all your posts across platforms in one timeline.",
  },
  {
    icon: Share2,
    title: "One-Click Multi-Platform Publishing",
    description:
      "Publish simultaneously to all your connected accounts. No more copy-pasting between tabs or logging into five different apps.",
  },
  {
    icon: BarChart3,
    title: "Unified Analytics",
    description:
      "Track likes, shares, impressions, and follower growth across every platform in a single dashboard. Know what's working.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members, assign roles, and set up approval workflows. Perfect for agencies and small marketing teams.",
  },
];

const steps = [
  {
    step: "1",
    title: "Connect your accounts",
    description:
      "Link your social media profiles with secure OAuth — we never see your passwords.",
  },
  {
    step: "2",
    title: "Create your content",
    description:
      "Write a single post and let AI adapt it for each platform's audience and format.",
  },
  {
    step: "3",
    title: "Schedule & publish",
    description:
      "Pick your times or let smart scheduling choose the optimal slots, then publish everywhere at once.",
  },
];

const benefits = [
  { icon: Clock, text: "Save 10+ hours per week on social media management" },
  { icon: Globe, text: "Reach audiences across 10 platforms from one place" },
  { icon: Shield, text: "Enterprise-grade security with encrypted credentials" },
  { icon: Layers, text: "Built for creators and teams of 2-10 people" },
];

export default function GetStartedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered social media management
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Stop juggling platforms.
            <br />
            <span className="text-primary">Start creating.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            SocialSpark is the all-in-one platform that lets you write content
            once, adapt it with AI for every social network, schedule it on a
            visual calendar, and track results — all from a single dashboard.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In to Existing Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Supported Platforms */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Publish to all the platforms you care about
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {platforms.map((platform) => (
              <span
                key={platform.name}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${platform.color}`}
              >
                {platform.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* How it works */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Go from idea to published across every platform in three simple steps.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Features deep dive */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Everything you need to grow your audience
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Powerful tools designed for creators and small teams who want to
            spend less time managing social media and more time creating.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Benefits */}
      <section className="bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Why creators choose SocialSpark
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit.text}
                className="flex items-start gap-4 rounded-lg border bg-card p-5"
              >
                <benefit.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="font-medium">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Pricing teaser */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Free to start. Scales as you grow.
          </h2>
          <p className="mb-4 text-muted-foreground">
            Get started with a free account that includes AI content adaptation,
            multi-platform publishing, and smart scheduling. Upgrade when you
            need more power.
          </p>
          <Card className="mx-auto max-w-sm">
            <CardContent className="pt-6">
              <ul className="space-y-3 text-left text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Up to 3 connected accounts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  30 scheduled posts per month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  AI content adaptation included
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Visual calendar & analytics
                </li>
              </ul>
            </CardContent>
          </Card>
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href="/pricing">
                View all plans & FAQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Final CTA */}
      <section className="bg-primary px-6 py-20 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to simplify your social media?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join creators and teams who are saving hours every week with
            SocialSpark. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/sign-up">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
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
