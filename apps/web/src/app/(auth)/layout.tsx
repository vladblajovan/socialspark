import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-bold text-xl transition-opacity hover:opacity-80"
      >
        <Zap className="h-6 w-6 text-primary" />
        SocialSpark
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        AI-native social media scheduling platform
      </p>
    </div>
  );
}
