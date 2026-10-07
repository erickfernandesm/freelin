import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, MapPin } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { orNotFound } from "@/server/page";
import { getContractorPublic } from "@/server/services/profile.service";
import { CONTRACTOR_CRITERIA } from "@/server/domain/reviews";
import { relativeTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Card, ReputationLine, Star } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Contratante" };

export default async function ContractorPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { profile: p, reputation, criteria, reviews, openOpportunities, totalOpportunities } = await orNotFound(getContractorPublic(id));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={p.displayName} src={p.user.avatarUrl} size={80} square={p.kind === "COMPANY"} />
          <div className="min-w-0">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{p.displayName}</h1>
            <p className="text-ink-2">{p.segment}</p>
            <ReputationLine rating={reputation.rating} jobs={reputation.jobs} reviews={reputation.reviews} className="mt-1.5" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-ink-2">
          {p.city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-brand" /> {p.city.name} - {p.city.state}
            </span>
          )}
          {p.instagram && (
            <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand">
              <AtSign className="size-4 text-brand" /> {p.instagram}
            </a>
          )}
          <span>{totalOpportunities} {totalOpportunities === 1 ? "oportunidade publicada" : "oportunidades publicadas"}</span>
        </div>
        {p.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-2">{p.description}</p>}
      </Card>

      {user.role === "FREELANCER" && openOpportunities.length > 0 && (
        <Card>
          <h2 className="font-bold">Oportunidades abertas</h2>
          <ul className="mt-2 divide-y divide-line">
            {openOpportunities.map((o) => (
              <li key={o.id}>
                <Link href={`/oportunidades/${o.id}`} className="flex justify-between gap-3 py-3 hover:text-brand">
                  <span className="font-semibold">{o.title}</span>
                  <span className="text-sm text-ink-3">{o.city.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="font-bold">O que dizem os profissionais</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-3">Ainda sem avaliações de freelancers.</p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              {CONTRACTOR_CRITERIA.filter((c) => criteria[c.key] != null).map((c) => (
                <div key={c.key}>
                  <dt className="text-xs font-semibold text-ink-3">{c.label}</dt>
                  <dd className="flex items-center gap-1 font-bold tabular">
                    <Star className="size-3.5 text-signal" />
                    {criteria[c.key].toFixed(1).replace(".", ",")}
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="mt-5 divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.author.name.split(" ")[0]}</span>
                    <span className="flex items-center gap-1 text-sm font-bold">
                      <Star className="size-3.5 text-signal" /> {r.overall}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">{relativeTime(r.createdAt)}</p>
                  {r.comment && <p className="mt-1.5 text-[15px] text-ink-2">“{r.comment}”</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
