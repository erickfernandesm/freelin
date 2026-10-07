import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Workers não rodam o otimizador de imagens do Next; assets já saem no tamanho certo
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }, // fotos de perfil já chegam redimensionadas
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Permite `next dev` com bindings da Cloudflare quando o pacote estiver instalado
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare")
    .then((m) => m.initOpenNextCloudflareForDev())
    .catch(() => {});
}
