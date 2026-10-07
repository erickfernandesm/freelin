import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-paper md:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white md:flex md:flex-col md:justify-between">
        <Logo variant="white" height={34} href="/" />
        <div>
          <p className="max-w-md text-[34px] font-extrabold leading-[1.1] tracking-[-0.02em]">
            Trabalho de verdade, perto de você, com quem já foi avaliado por outras pessoas.
          </p>
          <p className="mt-4 max-w-sm text-white/80">Juiz de Fora e região.</p>
        </div>
        <div aria-hidden className="absolute -bottom-24 -right-24 size-80 rounded-full border-[28px] border-white/10" />
      </aside>
      <main className="flex flex-col px-5 py-6 md:justify-center md:px-16">
        <div className="mb-10 md:hidden">
          <Logo height={28} href="/" />
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
