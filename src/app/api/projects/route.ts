import { NextResponse } from "next/server";
import { projects } from "@/content/profile";

export function GET() {
  return NextResponse.json({ count: projects.length, items: projects.map(({ slug, name, tagline, stack, year, internal }) => ({ slug, name, tagline, stack, year, internal: Boolean(internal) })) });
}
