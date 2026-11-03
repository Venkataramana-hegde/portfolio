import type { Metadata } from "next";
import { Gitlantis } from "@/components/ide/Gitlantis";

export const metadata: Metadata = {
  title: "Gitlantis",
  description: "Sail through the portfolio workspace. Explore folders as lighthouses and files as buoys.",
  alternates: { canonical: "/gitlantis" },
};

export default function GitlantisPage() {
  return <Gitlantis />;
}
