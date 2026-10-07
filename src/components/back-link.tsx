import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
      <ChevronLeft className="size-4" />
      {children}
    </Link>
  );
}
