"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Video } from "lucide-react";
import {
  adminGrantAccessAction,
  adminLessonAction,
  adminModuleAction,
  adminNewCourseAction,
  adminUpdateCourseAction,
} from "@/actions/admin-course";
import { ActionButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { BILLING_OPTIONS, durationLabel } from "@/lib/courses";
import { cn } from "@/lib/format";
import { Errors, useResettingForm } from "../form-bits";

type RoleOption = { id: string; name: string; emoji: string | null };

function RoleSelect({ roles, defaultValue }: { roles: RoleOption[]; defaultValue?: string | null }) {
  return (
    <Select name="roleId" defaultValue={defaultValue ?? ""} aria-label="Área">
      <option value="">Geral (sem área específica)</option>
      {roles.map((r) => (
        <option key={r.id} value={r.id}>
          {r.emoji ? `${r.emoji} ` : ""}
          {r.name}
        </option>
      ))}
    </Select>
  );
}

export function NewCourseForm({ roles }: { roles: RoleOption[] }) {
  const { onSubmit, pending, fe, state } = useActionForm(adminNewCourseAction);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-[4rem_1fr] gap-2">
        <Input name="emoji" placeholder="🎓" className="text-center" maxLength={4} aria-label="Emoji" />
        <Input name="title" placeholder="Nome do curso" aria-label="Nome do curso" invalid={!!fe.title} />
      </div>
      <Input name="provider" placeholder="Quem oferece (escola ou professor)" aria-label="Quem oferece" invalid={!!fe.provider} />
      <RoleSelect roles={roles} />
      <Errors fe={fe} error={state.error} />
      <Button type="submit" loading={pending} full icon={<Plus className="size-4" />}>
        Criar e montar o curso
      </Button>
    </form>
  );
}

type Settings = {
  id: string;
  title: string;
  provider: string;
  description: string;
  emoji: string | null;
  roleId: string | null;
  billing: string;
  priceCents: number | null;
  workloadHours: number | null;
  url: string | null;
  featured: boolean;
  active: boolean;
  certificateEnabled: boolean;
};

function centsToInput(cents: number | null) {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");
}

function Check({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint: string }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl p-3 ring-1 ring-line hover:bg-mist">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--color-brand)]" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-ink-3">{hint}</span>
      </span>
    </label>
  );
}

export function CourseSettingsForm({ course, roles }: { course: Settings; roles: RoleOption[] }) {
  const { onSubmit, pending, fe, state } = useActionForm(adminUpdateCourseAction);
  const [billing, setBilling] = useState(course.billing);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={course.id} />
      <div className="grid grid-cols-[4rem_1fr] gap-2">
        <Input name="emoji" defaultValue={course.emoji ?? ""} placeholder="🎓" className="text-center" maxLength={4} aria-label="Emoji" />
        <Input name="title" defaultValue={course.title} aria-label="Nome do curso" invalid={!!fe.title} />
      </div>
      <Field label="Quem oferece" error={fe.provider}>
        <Input name="provider" defaultValue={course.provider} />
      </Field>
      <Field label="Descrição" error={fe.description} hint="O que a pessoa vai aprender. Aparece na página do curso.">
        <Textarea name="description" defaultValue={course.description} className="min-h-32" />
      </Field>
      <Field label="Área">
        <RoleSelect roles={roles} defaultValue={course.roleId} />
      </Field>

      <div className="rounded-2xl bg-mist p-4">
        <Field label="Cobrança">
          <Select name="billing" value={billing} onChange={(e) => setBilling(e.target.value)}>
            {BILLING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        {billing !== "FREE" && (
          <Field
            label={billing === "MONTHLY" ? "Preço por mês" : billing === "YEARLY" ? "Preço por ano" : "Preço"}
            error={fe.price}
            className="mt-3"
          >
            <Input name="price" defaultValue={centsToInput(course.priceCents)} placeholder="R$ 97" inputMode="decimal" />
          </Field>
        )}
      </div>

      <Field label="Carga horária do certificado" optional error={fe.workloadHours} hint="Em horas. Aparece no certificado.">
        <Input name="workloadHours" defaultValue={course.workloadHours ?? ""} inputMode="numeric" placeholder="20" />
      </Field>

      <div className="space-y-2">
        <Check name="active" defaultChecked={course.active} label="Publicado na vitrine" hint="Desmarcado, o curso fica como rascunho." />
        <Check name="featured" defaultChecked={course.featured} label="Destacar" hint="Aparece primeiro e em azul na vitrine." />
        <Check
          name="certificateEnabled"
          defaultChecked={course.certificateEnabled}
          label="Emitir certificado"
          hint="Gerado automaticamente quando a pessoa conclui todas as aulas."
        />
      </div>

      <details className="rounded-2xl p-3 ring-1 ring-line">
        <summary className="text-sm font-semibold text-ink-2">Curso de parceiro (link externo)</summary>
        <Field
          label="Link do curso"
          optional
          error={fe.url}
          hint="Só para cursos hospedados fora do Freelin. Com link, a vitrine leva direto para o site do parceiro e as aulas daqui não são usadas."
          className="mt-3"
        >
          <Input name="url" type="url" defaultValue={course.url ?? ""} placeholder="https://" />
        </Field>
      </details>

      <FormError message={Object.keys(fe).length ? undefined : state.error} />
      <Button type="submit" loading={pending} full>
        Salvar curso
      </Button>
    </form>
  );
}

// ───────────── Módulos ─────────────

export function NewModuleForm({ courseId, first }: { courseId: string; first: boolean }) {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminModuleAction);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="op" value="create" />
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex gap-2">
        <Input name="title" placeholder={first ? "Nome do primeiro módulo, ex.: Introdução" : "Nome do novo módulo"} aria-label="Nome do módulo" />
        <Button type="submit" loading={pending} icon={<Plus className="size-4" />} className="shrink-0">
          Módulo
        </Button>
      </div>
      <Errors fe={fe} error={state.error} />
    </form>
  );
}

function IconAction({
  action,
  fields,
  label,
  icon,
  confirm,
  danger,
}: {
  action: Parameters<typeof ActionButton>[0]["action"];
  fields: Record<string, string>;
  label: string;
  icon: React.ReactNode;
  confirm?: string;
  danger?: boolean;
}) {
  return (
    <ActionButton
      action={action}
      fields={fields}
      variant="ghost"
      size="sm"
      confirm={confirm}
      className={cn("size-9 px-0!", danger && "hover:text-danger")}
      icon={icon}
    >
      <span className="sr-only">{label}</span>
    </ActionButton>
  );
}

export function ModuleHeader({
  module: m,
  index,
  isFirst,
  isLast,
  lessonCount,
}: {
  module: { id: string; title: string };
  index: number;
  isFirst: boolean;
  isLast: boolean;
  lessonCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminModuleAction, { onSuccess: close });

  if (editing) {
    return (
      <form ref={ref} onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="op" value="rename" />
        <input type="hidden" name="id" value={m.id} />
        <Input name="title" defaultValue={m.title} autoFocus className="min-w-0 flex-1" aria-label="Nome do módulo" />
        <Button type="submit" size="sm" loading={pending}>
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <div className="w-full">
          <Errors fe={fe} error={state.error} />
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Módulo {index + 1}</p>
        <h3 className="truncate text-lg font-bold">{m.title}</h3>
      </div>
      <div className="flex shrink-0 items-center">
        {!isFirst && <IconAction action={adminModuleAction} fields={{ op: "up", id: m.id }} label="Subir módulo" icon={<ArrowUp className="size-4" />} />}
        {!isLast && <IconAction action={adminModuleAction} fields={{ op: "down", id: m.id }} label="Descer módulo" icon={<ArrowDown className="size-4" />} />}
        <Button type="button" variant="ghost" size="sm" className="size-9 px-0!" onClick={() => setEditing(true)} aria-label="Renomear módulo">
          <Pencil className="size-4" />
        </Button>
        <IconAction
          action={adminModuleAction}
          fields={{ op: "delete", id: m.id }}
          label="Excluir módulo"
          icon={<Trash2 className="size-4" />}
          danger
          confirm={
            lessonCount
              ? `Excluir o módulo "${m.title}" e as ${lessonCount} aulas dele? O progresso dos alunos nessas aulas também sai.`
              : `Excluir o módulo "${m.title}"?`
          }
        />
      </div>
    </div>
  );
}

// ───────────── Aulas ─────────────

type LessonData = { id: string; title: string; description: string | null; videoUrl: string | null; durationMin: number | null };

function LessonForm({
  lesson,
  moduleId,
  onDone,
}: {
  lesson?: LessonData;
  moduleId?: string;
  onDone: () => void;
}) {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminLessonAction, { onSuccess: onDone });
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-mist p-4">
      <input type="hidden" name="op" value={lesson ? "update" : "create"} />
      {lesson ? <input type="hidden" name="id" value={lesson.id} /> : <input type="hidden" name="moduleId" value={moduleId} />}
      <Field label="Título da aula" error={fe.title}>
        <Input name="title" defaultValue={lesson?.title} autoFocus invalid={!!fe.title} />
      </Field>
      <Field label="Descrição" optional error={fe.description} hint="Resumo, materiais, exercícios. Aparece embaixo do vídeo.">
        <Textarea name="description" defaultValue={lesson?.description ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field label="Link do vídeo" optional error={fe.videoUrl} hint="YouTube (pode ser não listado), Vimeo ou arquivo .mp4">
          <Input name="videoUrl" type="url" defaultValue={lesson?.videoUrl ?? ""} placeholder="https://youtu.be/..." />
        </Field>
        <Field label="Duração" optional error={fe.durationMin} hint="Minutos">
          <Input name="durationMin" defaultValue={lesson?.durationMin ?? ""} inputMode="numeric" placeholder="12" />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {lesson ? "Salvar aula" : "Adicionar aula"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function LessonItem({
  lesson,
  number,
  isFirst,
  isLast,
}: {
  lesson: LessonData;
  number: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);
  if (editing) return <LessonForm lesson={lesson} onDone={close} />;
  const duration = durationLabel(lesson.durationMin);
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 tabular">{number}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{lesson.title}</p>
        <p className="flex items-center gap-2 text-xs text-ink-3">
          {lesson.videoUrl ? (
            <span className="inline-flex items-center gap-1">
              <Video className="size-3.5" /> Vídeo
            </span>
          ) : (
            <span>Sem vídeo</span>
          )}
          {duration && <span>{duration}</span>}
          {lesson.description && <span>Com descrição</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {!isFirst && <IconAction action={adminLessonAction} fields={{ op: "up", id: lesson.id }} label="Subir aula" icon={<ArrowUp className="size-4" />} />}
        {!isLast && <IconAction action={adminLessonAction} fields={{ op: "down", id: lesson.id }} label="Descer aula" icon={<ArrowDown className="size-4" />} />}
        <Button type="button" variant="ghost" size="sm" className="size-9 px-0!" onClick={() => setEditing(true)} aria-label="Editar aula">
          <Pencil className="size-4" />
        </Button>
        <IconAction
          action={adminLessonAction}
          fields={{ op: "delete", id: lesson.id }}
          label="Excluir aula"
          icon={<Trash2 className="size-4" />}
          danger
          confirm={`Excluir a aula "${lesson.title}"?`}
        />
      </div>
    </div>
  );
}

export function NewLesson({ moduleId }: { moduleId: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (open) return <LessonForm moduleId={moduleId} onDone={close} />;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line py-2.5 text-sm font-semibold text-ink-2 hover:border-brand hover:text-brand"
    >
      <Plus className="size-4" /> Adicionar aula
    </button>
  );
}

// ───────────── Inscrições ─────────────

export function GrantAccessForm({ courseId }: { courseId: string }) {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminGrantAccessAction);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder="E-mail da conta" aria-label="E-mail" />
        <Button type="submit" variant="secondary" loading={pending} className="shrink-0">
          Liberar
        </Button>
      </div>
      <Errors fe={fe} error={state.error} />
    </form>
  );
}
