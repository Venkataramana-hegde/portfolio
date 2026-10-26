import type { Metadata, Viewport } from "next";
import { Fira_Code } from "next/font/google";
import { Shell } from "@/components/ide/Shell";
import { education, person, site } from "@/content/profile";
import { Bootstrap } from "@/components/ide/Bootstrap";
import { defaultThemeId, themeById } from "@/content/themes";
import "./globals.css";

// One family, the editor's own: Fira Code, with ligatures on in code blocks.
const fira = Fira_Code({
  variable: "--font-fira",
  subsets: ["latin"],
  display: "swap",
});

const title = `${person.name} | ${person.role}`;
const description = `${person.summary} ${person.stackSummary.join(", ")}.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${person.name}`,
  },
  description,
  applicationName: person.name,
  authors: [{ name: person.name, url: site.url }],
  creator: person.name,
  keywords: [
    person.name,
    "full-stack engineer",
    "React developer",
    "Next.js developer",
    "Node.js",
    "GraphQL",
    "MongoDB",
    "Bangalore",
  ],
  openGraph: {
    type: "profile",
    url: "/",
    siteName: person.name,
    title,
    description,
    firstName: person.givenName,
    lastName: person.familyName,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: themeById(defaultThemeId).tokens.bg,
  // Both exist now, and the bootstrap sets the real one on <html>.
  colorScheme: "dark light",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  jobTitle: person.role,
  url: site.url,
  email: `mailto:${person.email}`,
  address: { "@type": "PostalAddress", addressLocality: person.location.split(",")[0], addressCountry: "IN" },
  worksFor: { "@type": "Organization", name: person.currentCompany },
  alumniOf: { "@type": "CollegeOrUniversity", name: education[0].school },
  sameAs: [person.github, person.linkedin],
  knowsAbout: person.stackSummary,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fira.variable} data-theme={defaultThemeId} data-appearance="dark">
      <head>
        <Bootstrap />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
