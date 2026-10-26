import type { Metadata } from "next";
import { OpenFileLink } from "@/components/ide/PageBits";

export const metadata: Metadata = { title: "File not found" };

export default function NotFound() {
  return (
    <article className="doc">
      <p className="note">bash</p>
      <h1>404</h1>
      <p>
        <span className="text-rose">cat: no such file or directory.</span> Nothing in this workspace lives at that
        address.
      </p>
      <p className="text-[0.875rem]">
        Try <OpenFileLink cmd="hello">_hello.tsx</OpenFileLink>, <OpenFileLink cmd="projects">projects</OpenFileLink> or{" "}
        <OpenFileLink cmd="contact">contact</OpenFileLink>. The explorer on the left lists every file, and{" "}
        <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 text-[0.75rem]">Ctrl K</kbd> jumps to any of
        them.
      </p>
    </article>
  );
}
