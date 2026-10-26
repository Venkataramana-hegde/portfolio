// Every link that opens a new tab goes through here, so the rel values and the
// screen-reader notice stay consistent.

export function ExternalLink({
  href,
  children,
  className = "link",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
