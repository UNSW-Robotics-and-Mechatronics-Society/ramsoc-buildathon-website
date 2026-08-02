import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Path from "@/app/path";

export const metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 w-full max-w-sm">
        <Link
          href={Path[2026].Root}
          className="font-blueprint text-ink-dim hover:text-ink inline-flex items-center gap-1.5 text-xs uppercase transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Buildathon
        </Link>
      </div>
      <SignUp
        signInUrl={Path[2026].SignIn}
        fallbackRedirectUrl={Path[2026].Onboarding}
      />
    </div>
  );
}
