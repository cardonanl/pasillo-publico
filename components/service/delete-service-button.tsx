"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteService } from "@/lib/actions/service";

interface Props {
  serviceId: string;
  serviceTitle: string;
}

export function DeleteServiceButton({ serviceId, serviceTitle }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteService(serviceId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="mt-1 w-full rounded-b-md border-x border-b border-dashed border-pp-border px-3 py-1.5 text-left text-xs text-pp-ink2 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        Eliminar
      </button>
    );
  }

  return (
    <div className="mt-1 rounded-b-md border-x border-b border-dashed border-pp-ink bg-pp-yellow/10 px-3 py-2.5">
      <p className="text-xs font-medium text-pp-ink">
        ¿Eliminar &ldquo;{serviceTitle}&rdquo;?
      </p>
      <p className="mt-0.5 text-xs text-pp-ink2">
        Esta acción no se puede deshacer.
      </p>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-full border border-pp-ink bg-pp-ink px-3 py-1 text-xs font-medium text-white disabled:opacity-50 hover:bg-pp-ink/80"
        >
          {isPending ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={isPending}
          className="rounded-full border border-pp-ink bg-white px-3 py-1 text-xs font-medium text-pp-ink hover:bg-pp-bg2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
