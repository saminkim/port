"use client";

import { useCallback, useState } from "react";
import { Check, Clipboard } from "lucide-react";
import type { ReflectionPayload } from "@/types/reflection";

type SectionKey = keyof ReflectionPayload;

const SECTIONS: {
  key: SectionKey;
  title: string;
  subtitle: string;
}[] = [
  {
    key: "what",
    title: "What? (thinking)",
    subtitle:
      "Thoughts at the time, how they shaped actions or feelings, and what you learned in the moment.",
  },
  {
    key: "so_what",
    title: "So what? (feeling)",
    subtitle:
      "Why it mattered, the values or feelings involved, and what that means for your learning.",
  },
  {
    key: "now_what",
    title: "Now what? (doing)",
    subtitle:
      "Concrete next steps, how you will change practice, and how you will keep developing.",
  },
];

type Props = {
  reflection: ReflectionPayload;
};

export function ReflectionOutputCards({ reflection }: Props) {
  const [copiedKey, setCopiedKey] = useState<SectionKey | null>(null);

  const copySection = useCallback(async (key: SectionKey, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } catch {
      setCopiedKey(null);
    }
  }, []);

  return (
    <section className="flex flex-col gap-4" aria-label="Generated reflection">
      <h2 className="text-lg font-semibold text-slate-900">Your reflection</h2>
      <div className="flex flex-col gap-4">
        {SECTIONS.map(({ key, title, subtitle }) => {
          const body = reflection[key];
          const copied = copiedKey === key;
          return (
            <article
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copySection(key, body)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-100"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" aria-hidden />
                      Copy to clipboard
                    </>
                  )}
                </button>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 sm:text-[15px]">
                {body}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
