/* components/AutoPromoteNotice.tsx */
"use client";

import { useEffect, useState } from "react";

export default function AutoPromoteNotice({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      onDone();
    }, 1500);
    return () => clearTimeout(timer);
  }, [visible, onDone]);

  if (!show) return null;

  return (
    <div className="auto-promote-notice" role="status" aria-live="polite">
      <span className="text-xs font-medium">Nextから自動で移動しました</span>
    </div>
  );
}
