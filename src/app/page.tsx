"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { AutoExpandingTextarea } from "@/components/AutoExpandingTextarea";
import { ReflectionOutputCards } from "@/components/ReflectionOutputCards";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import type { ReflectionPayload } from "@/types/reflection";

const STORAGE_KEY = "jrcptb-reflection-draft";

export default function Home() {
  const [notes, setNotes, notesHydrated] = useLocalStorageString(
    STORAGE_KEY,
    "",
  );
  const [reflection, setReflection] = useState<ReflectionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    const trimmed = notes.trim();
    if (!trimmed) {
      setError("Please enter some notes before generating.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trimmed }),
        signal: controller.signal,
      });

      const data = (await res.json()) as {
        what?: string;
        so_what?: string;
        now_what?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (
        typeof data.what !== "string" ||
        typeof data.so_what !== "string" ||
        typeof data.now_what !== "string"
      ) {
        setError("Unexpected response from the server. Please try again.");
        return;
      }

      setReflection({
        what: data.what,
        so_what: data.so_what,
        now_what: data.now_what,
      });
    } catch (e) {
      if (
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError")
      ) {
        return;
      }
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [notes]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-4 text-slate-900 sm:pt-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 sm:px-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            JRCPTB Reflection Assistant
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Paste rough notes from teaching or clinical work. We structure them
            into a Borton-style reflection for your e-portfolio.
          </p>
        </header>

        <div
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm"
          role="alert"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden
          />
          <p className="text-sm font-medium leading-relaxed text-amber-950 sm:text-[15px]">
            <span className="font-semibold">IMPORTANT:</span> Do{" "}
            <span className="font-semibold">NOT</span> enter Patient
            Identifiable Data (PID) such as names, DOBs, or hospital numbers.
            Keep scenarios anonymous.
          </p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-slate-800"
          >
            Your raw notes
          </label>
          <AutoExpandingTextarea
            id="notes"
            value={notes}
            onChange={setNotes}
            disabled={!notesHydrated}
            placeholder="e.g. Teaching on AKI management. Discussed pre-renal vs intrinsic. I struggled to explain contrast nephropathy clearly to the FY1..."
            minHeightClass="min-h-[180px]"
          />
          <p className="mt-2 text-xs text-slate-500">
            {notesHydrated
              ? "Draft is saved automatically on this device."
              : "Loading your saved draft…"}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !notesHydrated}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 opacity-90" aria-hidden />
                  Generate Reflection
                </>
              )}
            </button>
          </div>

          {error ? (
            <p
              className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="status"
            >
              {error}
            </p>
          ) : null}
        </section>

        {reflection ? (
          <ReflectionOutputCards reflection={reflection} />
        ) : null}
      </div>
    </div>
  );
}
