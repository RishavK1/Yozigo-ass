import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  widthClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, widthClassName = "max-w-md" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 px-4" role="dialog" aria-modal="true">
      <div className={clsx("w-full rounded-2xl bg-white p-6 shadow-xl", widthClassName)}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
