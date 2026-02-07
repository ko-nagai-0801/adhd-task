/* components/CelebrationFeedback.tsx */
"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "やった！",
  "いい調子！",
  "ナイス！",
  "一歩前進！",
  "完了！",
  "すごい！",
  "よくやった！",
  "その調子！",
];

function pick(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]!;
}

export default function CelebrationFeedback({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!visible) return;
    setMsg(pick());
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className="celebration-flash" role="status" aria-live="polite">
      <span className="text-lg font-bold">{msg}</span>
    </div>
  );
}
