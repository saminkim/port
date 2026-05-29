"use client";

import { useEffect, useRef } from "react";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeightClass?: string;
};

export function AutoExpandingTextarea({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  minHeightClass = "min-h-[120px]",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.max(el.scrollHeight, el.offsetHeight);
    el.style.height = `${next}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      rows={1}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-slate-900 shadow-inner outline-none ring-slate-900/5 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[15px] ${minHeightClass}`}
    />
  );
}
