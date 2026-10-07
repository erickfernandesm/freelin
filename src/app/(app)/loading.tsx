import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-72" />
      <div className="space-y-3 pt-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[1.25rem]" />
        ))}
      </div>
    </div>
  );
}
