"use client";

import { useEffect, useRef, useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused: select the address so the visitor can copy it by hand.
      const node = document.getElementById("contact-email");
      if (node) window.getSelection()?.selectAllChildren(node);
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-ghost">
      <span aria-live="polite">{copied ? "Copied" : "Copy address"}</span>
    </button>
  );
}
