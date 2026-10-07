import { Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div>
        <Logo height={32} className="mx-auto" />
        <h1 className="mt-10 text-3xl font-extrabold">Página não encontrada</h1>
        <p className="mt-2 text-ink-2">O link pode ter mudado ou a oportunidade foi encerrada.</p>
        <ButtonLink href="/" className="mt-6">
          Voltar ao início
        </ButtonLink>
      </div>
    </main>
  );
}
