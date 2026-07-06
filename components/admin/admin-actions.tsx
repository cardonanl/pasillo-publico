"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  approveArtist,
  rejectArtist,
  deleteArtist,
  generateResetLink,
} from "@/lib/actions/admin";

type Step =
  | "idle"
  | "confirm_reject"
  | "confirm_delete_1"
  | "confirm_delete_2"
  | "reset_done";

interface Props {
  artistId: string;
  username: string;
  isApproved: boolean;
}

const btnBase =
  "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50";

export function AdminActions({ artistId, username, isApproved }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("idle");
  const [deleteInput, setDeleteInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const busy = isPending;

  function resetState() {
    setStep("idle");
    setDeleteInput("");
    setError(null);
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveArtist(artistId);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  function handleRejectConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await rejectArtist(artistId);
      if (result.error) { setError(result.error); return; }
      resetState();
      router.refresh();
    });
  }

  function handleDeleteConfirm() {
    if (deleteInput !== username) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteArtist(artistId);
      if (result.error) { setError(result.error); return; }
      router.push("/admin");
    });
  }

  function handleGenerateReset() {
    setError(null);
    startTransition(async () => {
      const result = await generateResetLink(artistId);
      if (result.error) { setError(result.error); return; }
      if (result.link) {
        setResetLink(result.link);
        setStep("reset_done");
      }
    });
  }

  function copyLink() {
    if (!resetLink) return;
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 rounded-md border border-pp-ink bg-white p-5">
      <h2 className="font-display text-lg font-black text-pp-ink">Acciones</h2>

      {error && (
        <p className="rounded-md border border-pp-ink bg-pp-yellow/30 px-3 py-2 text-sm text-pp-ink">
          {error}
        </p>
      )}

      {/* ── Idle: botones principales ── */}
      {step === "idle" && (
        <div className="flex flex-wrap gap-2">
          {!isApproved ? (
            <button
              onClick={handleApprove}
              disabled={busy}
              className={`${btnBase} border-pp-ink bg-pp-yellow text-pp-ink shadow-[2px_2px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A]`}
            >
              ✓ Aprobar artista
            </button>
          ) : (
            <button
              onClick={() => setStep("confirm_reject")}
              disabled={busy}
              className={`${btnBase} border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2`}
            >
              Suspender acceso
            </button>
          )}

          <button
            onClick={handleGenerateReset}
            disabled={busy}
            className={`${btnBase} border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2`}
          >
            {busy ? "Generando…" : "Enviar reset de contraseña"}
          </button>

          <button
            onClick={() => setStep("confirm_delete_1")}
            disabled={busy}
            className={`${btnBase} border-red-700 bg-white text-red-700 hover:bg-red-50`}
          >
            Eliminar cuenta
          </button>
        </div>
      )}

      {/* ── Confirmar suspensión ── */}
      {step === "confirm_reject" && (
        <div className="space-y-3 rounded-md border border-pp-border bg-pp-bg2 p-4">
          <p className="text-sm font-medium text-pp-ink">
            ¿Suspender el acceso de este artista?
          </p>
          <p className="text-xs text-pp-ink2">
            El artista perderá visibilidad pública. Sus obras y servicios
            dejarán de aparecer en el pasillo hasta que vuelva a ser aprobado.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRejectConfirm}
              disabled={busy}
              className={`${btnBase} border-pp-ink bg-pp-ink text-white hover:bg-pp-ink/90`}
            >
              {busy ? "Suspendiendo…" : "Sí, suspender"}
            </button>
            <button
              onClick={resetState}
              disabled={busy}
              className={`${btnBase} border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminación paso 1 ── */}
      {step === "confirm_delete_1" && (
        <div className="space-y-3 rounded-md border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            ¿Eliminar la cuenta de @{username}?
          </p>
          <p className="text-xs text-red-600">
            Esta acción <strong>no se puede deshacer</strong>. Se eliminarán el
            perfil, todas sus obras y todos sus servicios de forma permanente.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("confirm_delete_2")}
              className={`${btnBase} border-red-700 bg-red-700 text-white hover:bg-red-800`}
            >
              Continuar
            </button>
            <button
              onClick={resetState}
              className={`${btnBase} border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminación paso 2: escribir username ── */}
      {step === "confirm_delete_2" && (
        <div className="space-y-3 rounded-md border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Escribe{" "}
            <code className="rounded bg-red-100 px-1 font-bold">
              {username}
            </code>{" "}
            para confirmar la eliminación definitiva.
          </p>
          <input
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={username}
            className="w-full rounded-md border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDeleteConfirm}
              disabled={busy || deleteInput !== username}
              className={`${btnBase} border-red-700 bg-red-700 text-white hover:bg-red-800 disabled:opacity-40`}
            >
              {busy ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
            <button
              onClick={resetState}
              disabled={busy}
              className={`${btnBase} border-pp-ink bg-white text-pp-ink hover:bg-pp-bg2`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Link de reset generado ── */}
      {step === "reset_done" && resetLink && (
        <div className="space-y-3 rounded-md border border-pp-border bg-pp-bg2 p-4">
          <p className="text-sm font-medium text-pp-ink">
            Enlace de recuperación generado. Cópialo y envíaselo al artista.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={resetLink}
              className="min-w-0 flex-1 rounded-md border border-pp-ink bg-white px-3 py-1.5 text-xs text-pp-ink2"
            />
            <button
              onClick={copyLink}
              className={`${btnBase} flex-shrink-0 border-pp-ink bg-pp-yellow text-pp-ink shadow-[2px_2px_0_#0A0A0A]`}
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <button
            onClick={resetState}
            className="text-xs text-pp-ink2 underline decoration-dotted hover:text-pp-ink"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
