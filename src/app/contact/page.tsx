import { ContactForm } from "@/components/ide/ContactForm";
import { FilePathNote } from "@/components/ide/PageBits";
import { ExternalIcon, GitHubIcon, LinkedInIcon, MailIcon } from "@/components/ide/Icons";
import { person, site } from "@/content/profile";
import { pageMetadata } from "@/lib/meta";

export const metadata = pageMetadata("contact", `Email ${person.name}, or connect on LinkedIn and GitHub.`);

const links = [
  { href: `mailto:${person.email}`, label: person.email, note: "the fastest way", Icon: MailIcon, external: false },
  { href: person.linkedin, label: "linkedin.com/in/venkataramanahegde", note: "LinkedIn", Icon: LinkedInIcon, external: true },
  { href: person.github, label: "github.com/Venkataramana-hegde", note: "GitHub", Icon: GitHubIcon, external: true },
  { href: site.resumePath, label: "resume.pdf", note: "one page", Icon: ExternalIcon, external: true },
];

export default function Contact() {
  return (
    <article className="doc max-w-5xl">
      <FilePathNote cmd="contact" />
      <h1>Contact me</h1>
      <p>
        I&apos;m in {person.city} ({person.location.split(", ")[1]}, IST). Email is the fastest way to reach me — type
        below and it will open in your own mail app, or copy the address and write to me however you like.
      </p>

      <ContactForm />

      <h2>Everywhere else</h2>
      <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {links.map(({ href, label, note, Icon, external }) => (
          <li key={label} className="bg-panel">
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raise"
            >
              <Icon className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span id={label === person.email ? "contact-address" : undefined} className="block truncate text-[0.8125rem] text-fg">
                  {label}
                </span>
                <span className="block text-[0.75rem] text-faint">{note}</span>
              </span>
              {external && (
                <>
                  <ExternalIcon className="size-3.5 shrink-0 text-faint" />
                  <span className="sr-only">(opens in a new tab)</span>
                </>
              )}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
