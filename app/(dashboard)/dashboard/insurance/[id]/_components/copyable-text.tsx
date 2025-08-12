"use client";

import React from "react";

export default function CopyableText({
  text,
  className,
  title = "Copy to clipboard",
}: {
  text: string;
  className?: string;
  title?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ?? "underline-offset-2 hover:underline"}
      title={title}
    >
      {copied ? "Copied!" : text}
    </button>
  );
}
