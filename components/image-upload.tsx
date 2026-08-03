"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadImagemAction } from "@/lib/actions/upload";
import type { Bucket } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  bucket: Bucket;
  value: string | null;
  onChange: (url: string | null) => void;
}

/** Upload de imagem com preview (DESIGN.md §7.9). Sobe via Server Action e
 *  devolve a URL pública para persistir na entidade. */
export function ImageUpload({ bucket, value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const r = await uploadImagemAction(bucket, fd);
      if (!r.ok) return setError(r.error);
      onChange(r.url);
    });
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-start gap-3">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Pré-visualização"
              className="h-24 w-24 rounded-md border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-1 text-muted-foreground hover:text-foreground"
              aria-label="Remover imagem"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Enviando…" : "Trocar imagem"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-muted/40 text-xs text-muted-foreground transition-colors hover:border-brand hover:bg-brand-subtle disabled:opacity-50"
        >
          <ImagePlus className="size-5" />
          {pending ? "Enviando…" : "Imagem"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onFile}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
