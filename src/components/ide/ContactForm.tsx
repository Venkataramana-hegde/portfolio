"use client";

import { useState } from "react";
import { person } from "@/content/profile";
import { CopyIcon, MailIcon } from "./Icons";

/* The form on the left writes the object on the right as you type, the way the
   reference does it. The site is static, so sending opens the visitor's own
   mail app with the message already filled in — no silent failures. */

const field = "h-9 w-full rounded border border-line bg-bg px-2.5 text-[0.8125rem] text-fg placeholder:text-faint focus:border-amber focus:outline-none";

function Line({ indent = 1, children }: { indent?: number; children: React.ReactNode }) {
  return <div className="ln"><span>{"  ".repeat(indent)}{children}</span></div>;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const ready = name.trim() && message.trim();
  const mailto = `mailto:${person.email}?subject=${encodeURIComponent(
    name.trim() ? `Hello from ${name.trim()}` : "Hello",
  )}&body=${encodeURIComponent(`${message.trim()}\n\n— ${name.trim()}${email.trim() ? `\n${email.trim()}` : ""}`)}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const node = document.getElementById("contact-address");
      if (node) window.getSelection()?.selectAllChildren(node);
    }
  }

  const str = (v: string, fallback: string) => (
    <span className="t-str">&quot;{v.trim() ? v.trim().replace(/"/g, '\\"') : fallback}&quot;</span>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = mailto;
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-name" className="text-[0.75rem] text-muted">
            _name
          </label>
          <input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className={field} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-email" className="text-[0.75rem] text-muted">
            _email
          </label>
          <input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" className={field} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-message" className="text-[0.75rem] text-muted">
            _message
          </label>
          <textarea
            id="cf-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="What are you building?"
            className={`${field} h-auto resize-y py-2 leading-relaxed`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!ready} className="btn btn-amber disabled:cursor-not-allowed disabled:opacity-45">
            <MailIcon className="size-4" />
            Open in my mail app
          </button>
          <button type="button" onClick={copyAddress} className="btn">
            <CopyIcon className="size-4" />
            <span aria-live="polite">{copied ? "Address copied" : "Copy address"}</span>
          </button>
        </div>
        <p className="text-[0.75rem] text-faint">
          {ready
            ? "This fills in your mail app — nothing is sent from the page."
            : "Fill in a name and a message to enable the button."}
        </p>
      </form>

      {/* Live preview of what the form builds. */}
      <figure className="overflow-hidden rounded-lg border border-line bg-panel">
        <figcaption className="flex items-center justify-between border-b border-line px-3 py-2 text-[0.75rem] text-muted">
          <span>message.ts</span>
          <span className={ready ? "text-mint" : "text-faint"}>{ready ? "ready" : "draft"}</span>
        </figcaption>
        <div className="code px-2 py-3" aria-hidden="true">
          <div className="ln"><span><span className="t-key">const</span> <span className="t-txt">message</span> <span className="t-punc">= {"{"}</span></span></div>
          <Line>
            <span className="t-prop">to</span>
            <span className="t-punc">: </span>
            <span className="t-str">&quot;{person.email}&quot;</span>
            <span className="t-punc">,</span>
          </Line>
          <Line>
            <span className="t-prop">from</span>
            <span className="t-punc">: </span>
            {str(name, "…")}
            <span className="t-punc">,</span>
          </Line>
          <Line>
            <span className="t-prop">replyTo</span>
            <span className="t-punc">: </span>
            {str(email, "…")}
            <span className="t-punc">,</span>
          </Line>
          <Line>
            <span className="t-prop">body</span>
            <span className="t-punc">: </span>
            {str(message, "…")}
            <span className="t-punc">,</span>
          </Line>
          <div className="ln"><span><span className="t-punc">{"}"};</span></span></div>
          <div className="ln"><span>&nbsp;</span></div>
          <div className="ln">
            <span>
              <span className="t-txt">mail</span>
              <span className="t-punc">.</span>
              <span className="t-fn">compose</span>
              <span className="t-punc">(</span>
              <span className="t-txt">message</span>
              <span className="t-punc">);</span>
              {ready && <span className="caret ml-1" />}
            </span>
          </div>
        </div>
      </figure>
    </div>
  );
}
