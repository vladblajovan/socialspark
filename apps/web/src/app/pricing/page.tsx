import { cookies } from "next/headers";
import Link from "next/link";
import { CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Spark",
    description: "For solo creators getting started",
    monthlyPrice: "Free",
    annualPrice: "Free",
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    features: [
      "3 social accounts",
      "30 scheduled posts/month per account",
      "20 AI content generations/month",
      "AI platform adaptation",
      "Visual calendar",
      "Basic analytics (7-day history)",
      "Media library (500 MB)",
    ],
  },
  {
    name: "Ignite",
    description: "For serious creators and freelancers",
    monthlyPrice: "$24",
    annualPrice: "$19",
    popular: true,
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    features: [
      "10 social accounts",
      "Unlimited scheduled posts",
      "100 AI content generations/month",
      "AI platform adaptation",
      "Visual calendar + optimal timing",
      "Full analytics (90-day history)",
      "Media library (5 GB)",
      "5 brand voice profiles",
      "Bulk scheduling (CSV upload)",
      "Trend radar",
      "Email support (48hr response)",
    ],
  },
  {
    name: "Blaze",
    description: "For teams and agencies",
    monthlyPrice: "$59",
    annualPrice: "$49",
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
    features: [
      "25 social accounts",
      "Unlimited scheduled posts",
      "500 AI content generations/month",
      "AI platform adaptation",
      "Everything in Ignite, plus:",
      "3 team members included (+$12/mo each)",
      "Approval workflows",
      "Team roles (owner, admin, editor, viewer)",
      "Full analytics (1-year history)",
      "Media library (25 GB)",
      "Unlimited brand voice profiles",
      "Unified inbox",
      "Priority support + live chat",
    ],
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. When you upgrade, you get immediate access to the new plan features. When you downgrade, your current plan stays active until the end of the billing period.",
  },
  {
    q: "What counts as an AI generation?",
    a: "Each time you ask the AI to generate or adapt content counts as one generation. This includes generating posts from topics, adapting content for different platforms, and improving existing drafts. Platform adaptation of a single post to multiple platforms counts as one generation.",
  },
  {
    q: "Is AI adaptation included on the free plan?",
    a: "Yes. AI adaptation is available on every plan, including Free. We limit the number of generations per month, not the feature itself. We believe every creator should experience the power of AI-adapted content.",
  },
  {
    q: "What platforms do you support?",
    a: "We currently support Twitter/X, LinkedIn, and Bluesky with more platforms coming soon, including Instagram, Facebook, Threads, TikTok, Pinterest, YouTube, and Mastodon.",
  },
  {
    q: "Do you store my social media passwords?",
    a: "Never. We use OAuth (the same secure method used by Google Sign-In) to connect to your social accounts. Your platform credentials are never shared with us. All access tokens are encrypted at rest with AES-256-GCM.",
  },
  {
    q: "What happens when I hit my post limit on the Free plan?",
    a: "You can still create drafts and use the editor, but you won't be able to schedule new posts until the next month or until you upgrade. Already-scheduled posts will still publish on time.",
  },
  {
    q: "Can I add more team members to the Blaze plan?",
    a: "Yes. The Blaze plan includes 3 team members. Additional members can be added for $12/month each, with no upper limit.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes. Both Ignite and Blaze come with a 14-day free trial. No credit card required to start. You get full access to all features during the trial.",
  },
];

export default async function PricingPage() {
  const cookieStore = await cookies();
  const isLoggedIn =
    cookieStore.get("better-auth.session_token") ||
    cookieStore.get("__Secure-better-auth.session_token");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-bold text-xl"
          >
            <Zap className="h-5 w-5 text-primary" />
            SocialSpark
          </Link>
          <nav className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Pricing Hero */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Start free, upgrade when you need more. No hidden fees, no surprise
          charges. All plans include AI content adaptation.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={
                tier.popular ? "relative border-primary shadow-lg" : ""
              }
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {tier.annualPrice}
                  </span>
                  {tier.annualPrice !== "Free" && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                  {tier.monthlyPrice !== tier.annualPrice &&
                    tier.monthlyPrice !== "Free" && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        billed annually, or {tier.monthlyPrice}/mo monthly
                      </p>
                    )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  className="w-full"
                  variant={tier.ctaVariant}
                  asChild
                >
                  <Link href={isLoggedIn ? "/dashboard/settings" : "/sign-up"}>
                    {isLoggedIn
                      ? tier.annualPrice === "Free"
                        ? "Current Plan"
                        : "Upgrade"
                      : tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <ul className="space-y-3 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/40 px-6 py-20" id="faq">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {isLoggedIn ? "Ready to upgrade?" : "Ready to get started?"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isLoggedIn
            ? "Unlock more accounts, unlimited posts, and advanced features."
            : "Create your free account today. No credit card required."}
        </p>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href={isLoggedIn ? "/dashboard/settings" : "/sign-up"}>
              {isLoggedIn ? "Manage Subscription" : "Create Free Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
