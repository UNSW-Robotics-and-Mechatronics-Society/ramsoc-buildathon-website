import Link from "next/link";
import Image from "next/image";
import Path from "@/app/path";
import { DISCORD_INVITE } from "@/app/2026/_data/socials";

export default function Footer() {
  return (
    <footer className="border-grid-major bg-blueprint-950/60 mt-8 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/2026/brand/ramsoc-logo.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 opacity-80"
          />
          <p className="font-blueprint text-ink-dim text-xs uppercase">
            © {new Date().getFullYear()} UNSW Robotics &amp; Mechatronics
            Society
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <a href={Path[2026].Faq} className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase">
            FAQ
          </a>
          <a href={Path[2026].Support} className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase">
            Support
          </a>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noreferrer noopener"
            className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase"
          >
            Discord
          </a>
          <Link
            href={Path[2026].Dashboard}
            className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
