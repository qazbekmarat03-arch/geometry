"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-[28px] border border-white bg-[#fcfdf9] p-0 text-ink shadow-[0_32px_100px_-20px_#10221860] backdrop:bg-[#102218]/40 backdrop:backdrop-blur-md"
    >
      <div className="p-7 sm:p-9">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-medium tracking-tight">
            {title}
          </h2>
          <Button
            variant="ghost"
            className="p-2"
            aria-label="Жабу"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
