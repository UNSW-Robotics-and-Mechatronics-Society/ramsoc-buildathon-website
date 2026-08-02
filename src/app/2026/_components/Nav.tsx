"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Path from "@/app/path";
import { cn } from "@/app/_utils/cn";

const LINKS = [
  { label: "About", href: Path[2026].About },
  { label: "Timeline", href: Path[2026].Timeline },
  { label: "Resources", href: Path[2026].Resources },
  { label: "FAQ", href: Path[2026].Faq },
  { label: "Partners", href: Path[2026].Sponsors },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  // Until Clerk resolves we show the neutral "Register" label rather than
  // flashing the wrong call to action at a signed-in user.
  const ctaHref = isSignedIn ? Path[2026].Dashboard : Path[2026].SignUp;
  const ctaLabel = isLoaded && isSignedIn ? "Dashboard" : "Register";

  return (
    <header className="border-grid-major bg-blueprint-900/85 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <Link
          href={Path[2026].Root}
          className="font-stud text-ink text-2xl leading-none lowercase"
        >
          buildathon
          <span className="text-lego-yellow font-stud ml-2 align-baseline text-xl">
            2026
          </span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link href={ctaHref} className="button hidden text-sm md:inline-flex">
            {ctaLabel}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-ink flex h-11 w-11 items-center justify-center rounded-lg md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        className={cn(
          "border-grid bg-blueprint-900 overflow-hidden border-t md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <ul className="flex flex-col px-4 py-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-blueprint text-ink-dim hover:text-ink block py-3 text-xs uppercase"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="py-3">
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="button w-full text-sm"
            >
              {ctaLabel}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
