/* components/UndoToast.tsx */
"use client";

import { useEffect } from "react";

export default function UndoToast({
  visible,
  onUndo,
  onClose,
}: {
  visible: boolean;
  onUndo: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast-enter card p-3 flex items-center gap-3">
        <span className="text-sm">取り消しました。元に戻す？</span>
        <button
          onClick={onUndo}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          元に戻す
        </button>
        <button
          onClick={onClose}
          className="btn-outline px-2 py-1.5 text-xs"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
