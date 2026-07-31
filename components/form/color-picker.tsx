"use client";

import { Input } from "@/components/ui/input";

/** Presets padrão (claro / escuro). */
export const COR_PRESETS = ["#F3F4F6", "#18191F"];

/**
 * Campo de cor: seletor nativo (color) + hex editável + swatches de preset.
 * O valor é sempre o hex em texto (mantém compatibilidade com o que já é salvo).
 */
export function ColorPicker({
  id,
  value,
  onChange,
  presets = COR_PRESETS,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  presets?: string[];
}) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Seletor de cor"
        value={isHex ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#F3F4F6"
        className="w-28 font-mono"
      />
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            title={p}
            onClick={() => onChange(p)}
            className="size-7 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: p }}
          />
        ))}
      </div>
    </div>
  );
}
