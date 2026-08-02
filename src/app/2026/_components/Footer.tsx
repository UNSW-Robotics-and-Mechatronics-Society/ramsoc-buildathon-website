import Link from "next/link";
import Path from "@/app/path";

export default function Footer() {
  return (
    <footer className="border-grid-major bg-blueprint-950/60 mt-8 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-blueprint text-ink-dim text-xs uppercase">
          © {new Date().getFullYear()} UNSW Robotics &amp; Mechatronics Society
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          <a href={Path[2026].Faq} className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase">
            FAQ
          </a>
          <a href={Path[2026].Support} className="font-blueprint text-ink-dim hover:text-ink text-xs uppercase">
            Support
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
