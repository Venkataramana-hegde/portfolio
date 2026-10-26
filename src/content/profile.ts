// Single source of truth for everything the site says.
// Edit this file to update the portfolio; components only render it.

export const site = {
  // Set NEXT_PUBLIC_SITE_URL to the production domain once it is connected.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://venkataramana-hegde.vercel.app").replace(/\/+$/, ""),
  resumePath: "/venkataramana-hegde-resume.pdf",
  repo: "venkataramana-hegde",
};

export const person = {
  name: "Venkataramana Hegde",
  givenName: "Venkataramana",
  familyName: "Hegde",
  handle: "venkataramana-hegde",
  role: "Full-stack engineer",
  location: "Bangalore, Karnataka",
  city: "Bangalore",
  summary:
    "Full-stack engineer in Bangalore. I build the reporting, billing and care-operations software that runs Helpee Elder Care.",
  email: "venkataramanahegde64@gmail.com",
  github: "https://github.com/Venkataramana-hegde",
  linkedin: "https://www.linkedin.com/in/venkataramanahegde",
  currentCompany: "Helpee Elder Care",
  stackSummary: ["React", "Next.js", "Node.js", "GraphQL", "MongoDB"],
};

/* ---------------------------------------------------------------- experience
   Each role is a commit in the source-control panel. `hash` is fixed rather
   than generated so the log is identical on the server and in the browser. */

export type Role = {
  id: string;
  hash: string;
  branch: string;
  company: string;
  title: string;
  place: string;
  start: string;
  end: string;
  current?: boolean;
  summary: string;
  // Shown as added lines in the commit diff.
  added: string[];
  // Files "touched", for the diff header.
  files: { path: string; added: number }[];
};

export const experience: Role[] = [
  {
    id: "helpee-junior",
    hash: "9f3c1ad",
    branch: "main",
    company: "Helpee Elder Care",
    title: "Junior Full-stack Development Engineer",
    place: "Bangalore",
    start: "Dec 2025",
    end: "Present",
    current: true,
    summary:
      "Own the reporting platform and build the finance, attendance, booking and calling systems the operations team runs on every day.",
    added: [
      "Reporting platform owned end to end, grown to 40+ reports with virtualized views, advanced filtering, downloads and cron-scheduled email delivery to management.",
      "Finance and invoicing workflows in GraphQL and MongoDB: invoice automation, payment revisions with role-based auto-approval, billing projections, invoice aging and settlements.",
      "Attendance and billing workflow: attendance approvals, automatic credit generation, invoice-coverage validation and caregiver replacement and handover tracking.",
      "Enquiry-to-booking workflows: caregiver matching and ranking, care summaries, closure and refund flows, and deployment-date tracking.",
      "TeleCMI call routing with Apollo subscriptions and incoming-call popups, plus Wix traffic, channel and form-level marketing analytics.",
    ],
    files: [
      { path: "reporting/platform.ts", added: 40 },
      { path: "finance/invoicing.ts", added: 28 },
      { path: "attendance/billing.ts", added: 22 },
      { path: "booking/enquiry.ts", added: 19 },
      { path: "integrations/telecmi.ts", added: 14 },
    ],
  },
  {
    id: "helpee-intern",
    hash: "4b7e802",
    branch: "main",
    company: "Helpee Elder Care",
    title: "Full-stack Development Intern",
    place: "Bangalore",
    start: "Jun 2025",
    end: "Dec 2025",
    summary:
      "Built the first configurable reporting platform, the role-based access layer under it, and the caregiver rating and customer success workflows.",
    added: [
      "Configurable reporting platform in React, Node.js, TypeScript and MongoDB with 30+ reports across leads, deployment, attendance, finance and customer success, including dynamic filters, Excel exports and admin-managed report configuration.",
      "Role-based access control for 7+ roles through a reusable backend access-filter layer that enforces report-level and data-level permissions.",
      "Caregiver rating workflow: rating APIs, automated WhatsApp links through WATI at key booking events, ratings reporting and daily email notifications.",
      "Customer success workflows with editable comments, status actions, refund and revive decisions, and automatic notifications to city heads.",
    ],
    files: [
      { path: "reporting/config.ts", added: 30 },
      { path: "auth/access-filter.ts", added: 24 },
      { path: "ratings/wati.ts", added: 16 },
      { path: "customer-success/index.ts", added: 12 },
    ],
  },
  {
    id: "healthletic",
    hash: "1c05f6e",
    branch: "main",
    company: "Healthletic Lifestyle",
    title: "Backend Development Intern",
    place: "Mysore",
    start: "Feb 2025",
    end: "Apr 2025",
    summary:
      "Built authentication and medicine reminder APIs, and wrote the engineering SOPs the team used for API conventions and day-to-day workflow.",
    added: [
      "Authentication for the backend APIs, with protected routes and access control.",
      "Medicine reminder and tracker APIs covering creation, retrieval, updates and scheduling data.",
      "Engineering SOPs documenting development workflows, API conventions and operational processes.",
    ],
    files: [
      { path: "auth/routes.ts", added: 18 },
      { path: "reminders/api.ts", added: 15 },
      { path: "docs/engineering-sop.md", added: 9 },
    ],
  },
];

/* ------------------------------------------------------------------ projects
   `public` projects have a live URL and a screenshot. Helpee systems are
   internal, so they are listed without a link. */

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  points: string[];
  stack: string[];
  year: string;
  href?: string;
  hrefLabel?: string;
  repo?: string;
  image?: string;
  internal?: boolean;
  lighthouse?: { label: string; score: number }[];
};

export const projects: Project[] = [
  {
    slug: "the-cradle",
    name: "The Cradle",
    tagline: "Playschool website and admin dashboard",
    summary:
      "A production website for a Montessori playschool and the admin dashboard behind it. I built both, connected them, and run the deployment.",
    points: [
      "Responsive pages with dynamic content from Supabase.",
      "Admin dashboard to approve or delete review submissions and to upload or remove images.",
      "The public site reads through the admin platform, so editors never modify production data directly.",
      "Deployed and maintained on Hostinger, including live-site configuration.",
    ],
    stack: ["Next.js", "TypeScript", "Supabase", "Hostinger"],
    year: "2025",
    href: "https://thecradle.co.in",
    hrefLabel: "thecradle.co.in",
    image: "/projects/the-cradle.jpg",
  },
  {
    slug: "ai-article-summarizer",
    name: "AI Article Summarizer",
    tagline: "Paste a URL, get a summary",
    summary: "Paste the URL of an article and get a short summary back. Built to be fast and usable by everyone.",
    points: [
      "RapidAPI integration that processes article URLs and returns concise summaries.",
      "Explicit loading and error states, and a responsive layout for submitting and reading.",
    ],
    stack: ["React", "JavaScript", "RapidAPI", "Netlify"],
    year: "2025",
    href: "https://rad-cat-ccc452.netlify.app/",
    hrefLabel: "rad-cat-ccc452.netlify.app",
    image: "/projects/ai-article-summarizer.jpg",
    lighthouse: [
      { label: "Performance", score: 94 },
      { label: "Accessibility", score: 100 },
      { label: "Best practices", score: 100 },
      { label: "SEO", score: 91 },
    ],
  },
  {
    slug: "reporting-platform",
    name: "Reporting platform",
    tagline: "40+ reports, row-level access",
    summary:
      "The reporting platform the Helpee operations team runs on. I own it end to end, from the React views to the cron jobs that email reports out.",
    points: [
      "40+ reports across leads, deployment, attendance, finance and customer success.",
      "Virtualized report views with advanced filtering and Excel downloads.",
      "One reusable access-filter layer enforces report-level and row-level permissions for 7+ roles.",
      "Cron-scheduled email delivery, so management gets the numbers without asking.",
    ],
    stack: ["React", "Node.js", "TypeScript", "MongoDB"],
    year: "2025",
    internal: true,
  },
  {
    slug: "finance-invoicing",
    name: "Finance and invoicing",
    tagline: "Invoices, revisions, settlements",
    summary:
      "The money side of Helpee: invoice automation, payment revisions with role-based auto-approval, billing projections, invoice aging and settlements.",
    points: [
      "Invoice automation built on GraphQL and MongoDB.",
      "Payment revisions that auto-approve based on the requester's role.",
      "Billing projections, invoice aging and settlement workflows.",
      "Attendance-driven credits with invoice-coverage validation.",
    ],
    stack: ["GraphQL", "MongoDB", "Node.js"],
    year: "2026",
    internal: true,
  },
  {
    slug: "call-routing",
    name: "Call routing",
    tagline: "Live incoming-call popups",
    summary:
      "TeleCMI call routing wired into the operations app, so the right teammate sees an incoming-call popup with the caller's context already loaded.",
    points: [
      "TeleCMI integration for routing calls to the right team.",
      "Apollo subscriptions push incoming calls to the browser in real time.",
      "Call popups carry the customer's context, so nobody starts the call blind.",
    ],
    stack: ["GraphQL", "Apollo", "TeleCMI"],
    year: "2026",
    internal: true,
  },
  {
    slug: "enquiry-to-booking",
    name: "Enquiry to booking",
    tagline: "Caregiver matching and ranking",
    summary:
      "The path from a new enquiry to a deployed caregiver: matching and ranking, care summaries, closure and refund flows, and deployment-date tracking.",
    points: [
      "Caregiver matching and ranking against the enquiry's needs.",
      "Care summaries that give the family one readable picture.",
      "Closure and refund decisions, with deployment-date tracking.",
    ],
    stack: ["React", "Node.js", "MongoDB"],
    year: "2026",
    internal: true,
  },
];

/* ---------------------------------------------------------------- extensions
   Skills, shown as marketplace entries. `projects` is how many things on this
   site use it, and `since` is when I started: both are real, unlike a download
   count would be. */

export type Extension = {
  id: string;
  name: string;
  category: "Languages" | "Frontend" | "Backend" | "Data" | "Integrations" | "Tooling";
  blurb: string;
  since: string;
  projects: number;
  level: 1 | 2 | 3 | 4 | 5;
  color: string;
  mark: string;
};

export const extensions: Extension[] = [
  { id: "typescript", name: "TypeScript", category: "Languages", blurb: "Typed JavaScript. My default for everything I start.", since: "2024", projects: 6, level: 5, color: "#3178C6", mark: "TS" },
  { id: "javascript", name: "JavaScript", category: "Languages", blurb: "The language underneath. ES2022 and up.", since: "2023", projects: 6, level: 5, color: "#F7DF1E", mark: "JS" },
  { id: "react", name: "React", category: "Frontend", blurb: "Component UI. Hooks, context, Suspense.", since: "2024", projects: 6, level: 5, color: "#61DAFB", mark: "Re" },
  { id: "nextjs", name: "Next.js", category: "Frontend", blurb: "App Router, server components, static export.", since: "2024", projects: 3, level: 4, color: "#E5E9F0", mark: "N" },
  { id: "tailwind", name: "Tailwind CSS", category: "Frontend", blurb: "Utility-first styling with design tokens.", since: "2024", projects: 3, level: 4, color: "#38BDF8", mark: "Tw" },
  { id: "node", name: "Node.js", category: "Backend", blurb: "Services, cron jobs and report pipelines.", since: "2024", projects: 5, level: 5, color: "#5FA04E", mark: "No" },
  { id: "express", name: "Express.js", category: "Backend", blurb: "REST APIs, middleware and route guards.", since: "2024", projects: 4, level: 4, color: "#9CA3AF", mark: "Ex" },
  { id: "graphql", name: "GraphQL", category: "Backend", blurb: "Schemas and resolvers for finance workflows.", since: "2025", projects: 3, level: 4, color: "#E535AB", mark: "GQ" },
  { id: "apollo", name: "Apollo", category: "Backend", blurb: "Client cache and subscriptions for live call popups.", since: "2025", projects: 2, level: 3, color: "#C98BDF", mark: "Ap" },
  { id: "mongodb", name: "MongoDB", category: "Data", blurb: "Aggregation pipelines behind 40+ reports.", since: "2024", projects: 5, level: 4, color: "#47A248", mark: "Mg" },
  { id: "supabase", name: "Supabase", category: "Data", blurb: "Postgres, auth and storage for The Cradle.", since: "2025", projects: 1, level: 3, color: "#3ECF8E", mark: "Sb" },
  { id: "wati", name: "WATI", category: "Integrations", blurb: "WhatsApp messages at key booking events.", since: "2025", projects: 1, level: 3, color: "#25D366", mark: "Wa" },
  { id: "telecmi", name: "TeleCMI", category: "Integrations", blurb: "Call routing with real-time popups.", since: "2026", projects: 1, level: 3, color: "#FEA55F", mark: "Tc" },
  { id: "git", name: "Git", category: "Tooling", blurb: "Branches, reviews and release hygiene.", since: "2023", projects: 6, level: 4, color: "#F05033", mark: "Gi" },
  { id: "vercel", name: "Vercel", category: "Tooling", blurb: "Preview deploys and production hosting.", since: "2024", projects: 2, level: 4, color: "#E5E9F0", mark: "Vc" },
];

export const education = [
  { school: "MVJ College of Engineering", degree: "Bachelor of Engineering", result: "CGPA 8.6", years: "2021–2025", place: "Bangalore" },
  { school: "AMC PU College", degree: "Pre-university", result: "99%", years: "2019–2021", place: "Hyderabad" },
];

export const certifications = [
  { name: "An Introduction to Generative AI", issuer: "Infosys Springboard", year: 2025 },
  { name: "Learn React", issuer: "Scrimba", year: 2025 },
  { name: "Project Management Job Simulation", issuer: "Accenture", year: 2024 },
];

// Shown on the hello screen as quick facts.
export const stats = [
  { value: "40+", label: "reports in production" },
  { value: "7+", label: "roles under access control" },
  { value: "3", label: "engineering roles" },
  { value: "2", label: "sites shipped publicly" },
];

export const interests = [
  "Building internal tools people use every day",
  "Making slow report screens fast",
  "Access control that is simple to reason about",
];
