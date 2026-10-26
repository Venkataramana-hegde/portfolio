import type { Metadata } from "next";
import { findFile } from "@/content/workspace";

/** Per-page metadata, keyed by the file's short command name. */
export function pageMetadata(cmd: string, description?: string): Metadata {
  const file = findFile(cmd)!;
  const desc = description ?? file.blurb;
  return {
    title: file.title,
    description: desc,
    alternates: { canonical: file.href },
    openGraph: { url: file.href, title: file.title, description: desc },
  };
}
