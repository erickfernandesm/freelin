import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Freelin | Trabalho perto de você", template: "%s · Freelin" },
  description:
    "Quem procura trabalho encontra oportunidades. Quem precisa de profissionais encontra pessoas disponíveis. Juiz de Fora e região.",
  applicationName: "Freelin",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Freelin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2C67E8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={figtree.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
