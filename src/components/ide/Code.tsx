/* A tiny token renderer, so code panels are written as data instead of as a
   pile of spans. `k` is the token kind; see the .t-* classes in globals.css. */

export type Tok = [kind: "key" | "str" | "fn" | "num" | "prop" | "com" | "punc" | "txt", text: string];

const cls: Record<Tok[0], string> = {
  key: "t-key",
  str: "t-str",
  fn: "t-fn",
  num: "t-num",
  prop: "t-prop",
  com: "t-com",
  punc: "t-punc",
  txt: "",
};

export function CodeBlock({ lines, label }: { lines: Tok[][]; label: string }) {
  return (
    <div className="code overflow-x-auto" role="region" aria-label={label}>
      {lines.map((line, i) => (
        <div key={i} className="ln">
          <span>
            {line.length === 0 ? " " : line.map(([kind, text], j) => <span key={j} className={cls[kind]}>{text}</span>)}
          </span>
        </div>
      ))}
    </div>
  );
}
