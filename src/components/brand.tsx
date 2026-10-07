import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";

/** Logo oficial. "on-blue" usa a versão branca para fundos azuis. */
export function Logo({
  variant = "default",
  height = 28,
  href,
  className,
}: {
  variant?: "default" | "white";
  height?: number;
  href?: string;
  className?: string;
}) {
  const src = variant === "white" ? "/brand/wordmark-white.png" : "/brand/wordmark.png";
  const img = (
    <Image
      src={src}
      alt="Freelin"
      width={Math.round((1421 / 390) * height)}
      height={height}
      priority
      className={cn("h-auto select-none", className)}
      style={{ height, width: "auto" }}
    />
  );
  return href ? (
    <Link href={href} aria-label="Freelin — início" className="inline-flex">
      {img}
    </Link>
  ) : (
    img
  );
}

export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return <Image src="/brand/icon-192.png" alt="" width={size} height={size} className={cn("rounded-full", className)} />;
}
