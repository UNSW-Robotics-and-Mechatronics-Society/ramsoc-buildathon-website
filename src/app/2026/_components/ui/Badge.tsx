import { cn } from "@/app/_utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Small status chip. Colours come from the LEGO accent palette so badges read
 * as part of the brick vocabulary rather than as generic Tailwind status
 * colours — green for settled, yellow for outstanding, red for problems.
 */
const badgeVariants = cva(
  "font-blueprint inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs uppercase",
  {
    variants: {
      variant: {
        default: "border-white/20 bg-white/10 text-ink-dim",
        success: "border-lego-green/50 bg-lego-green/20 text-lego-green",
        warning: "border-lego-yellow/50 bg-lego-yellow/15 text-lego-yellow",
        danger: "border-lego-red/50 bg-lego-red/20 text-[#ff8a90]",
        info: "border-lego-azure/50 bg-lego-azure/20 text-lego-azure",
        captain: "border-lego-yellow bg-lego-yellow text-[#0a2a55] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof badgeVariants>;

export default function Badge({ children, className, variant }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))}>{children}</span>
  );
}
