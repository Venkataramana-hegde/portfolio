import { langMark, type Lang } from "@/content/workspace";

type P = { className?: string };

function S({ className = "size-5", children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const FilesIcon = (p: P) => (
  <S {...p}>
    <path d="M14 3H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M6 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" />
  </S>
);

export const SearchIcon = (p: P) => (
  <S {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </S>
);

export const BranchIcon = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="5.5" r="2.25" />
    <circle cx="6" cy="18.5" r="2.25" />
    <circle cx="18" cy="8" r="2.25" />
    <path d="M6 7.75v8.5" />
    <path d="M18 10.25c0 4.5-6 3.5-11 7" />
  </S>
);

export const BlocksIcon = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="10.5" width="6" height="6" rx="1" />
    <rect x="10" y="10.5" width="6" height="6" rx="1" />
    <rect x="3.5" y="17" width="6" height="4" rx="1" />
    <rect x="13.5" y="3" width="7" height="7" rx="1" transform="rotate(14 17 6.5)" />
  </S>
);

export const BracesIcon = (p: P) => <S {...p}><path d="M9 4C6 4 7 8 5 9c2 1 1 5 4 5M15 4c3 0 2 4 4 5-2 1-1 5-4 5" /></S>;
export const DatabaseIcon = (p: P) => <S {...p}><ellipse cx="12" cy="5.5" rx="7" ry="3" /><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></S>;
export const GearIcon = (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.3 3h-4.6l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.6l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></S>;
export const SparkIcon = (p: P) => <S {...p}><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3zM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6z" /></S>;

export const TerminalIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="m7 9.5 3 2.5-3 2.5" />
    <path d="M12.5 15H17" />
  </S>
);

export const MenuIcon = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);

export const CloseIcon = (p: P) => (
  <S {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </S>
);

export const ChevronIcon = (p: P) => (
  <S {...p}>
    <path d="m9 6 6 6-6 6" />
  </S>
);

export const ExternalIcon = (p: P) => (
  <S {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </S>
);

export const CheckIcon = (p: P) => (
  <S {...p}>
    <path d="m5 12.5 5 5 9-11" />
  </S>
);

export const CopyIcon = (p: P) => (
  <S {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
  </S>
);

export const DownloadIcon = (p: P) => (
  <S {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </S>
);

export const ErrorIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </S>
);

export const WarnIcon = (p: P) => (
  <S {...p}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4M12 17h.01" />
  </S>
);

export const StarIcon = ({ className = "size-3.5", filled }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m12 3.5 2.7 5.6 6.1.85-4.4 4.3 1.05 6.1L12 17.5l-5.45 2.85L7.6 14.25l-4.4-4.3 6.1-.85z" />
  </svg>
);

export const GitHubIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export const LinkedInIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

export const MailIcon = ({ className = "size-4" }: P) => (
  <S className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </S>
);

/** Coloured file-type badge, the way an editor marks files. */
export function FileMark({ lang, className = "" }: { lang: Lang; className?: string }) {
  const m = langMark[lang];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex w-7 shrink-0 justify-center text-[0.5625rem] leading-none font-bold tracking-tight ${className}`}
      style={{ color: m.color }}
    >
      {m.text}
    </span>
  );
}
