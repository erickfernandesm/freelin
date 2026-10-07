"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

/** Redimensiona no navegador (máx. 320px, JPEG) antes de enviar: rápido no 4G e leve no banco */
async function resize(file: File, max = 320): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const side = Math.round(Math.min(bitmap.width, bitmap.height) * scale);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d")!;
  // recorte quadrado centralizado
  const s = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - s) / 2, (bitmap.height - s) / 2, s, s, 0, 0, side, side);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AvatarPicker({
  name,
  current,
  square,
  label = "Foto de perfil",
}: {
  name: string;
  current?: string | null;
  square?: boolean;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name="avatar" value={value} />
      <Avatar name={name || "?"} src={preview} size={76} square={square} />
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-paper px-3.5 text-sm font-semibold ring-1 ring-inset ring-line hover:bg-mist"
          >
            <Camera className="size-4" /> {preview ? "Trocar" : "Adicionar"} {label.toLowerCase()}
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setValue("__remove__");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-3 hover:bg-ink/5"
              aria-label="Remover foto"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-ink-3">{error ?? (square ? "Um logo nítido ajuda os freelancers a reconhecerem vocês." : "Uma foto nítida do rosto passa mais confiança.")}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError(null);
          try {
            const data = await resize(file);
            setPreview(data);
            setValue(data);
          } catch {
            setError("Não foi possível ler esta imagem. Tente outra.");
          }
        }}
      />
    </div>
  );
}
