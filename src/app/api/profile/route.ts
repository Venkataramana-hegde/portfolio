import { NextResponse } from "next/server";
import { person, projects } from "@/content/profile";

export function GET() {
  return NextResponse.json({ name: person.name, role: person.role, company: person.currentCompany, location: person.location, stack: person.stackSummary, projects: projects.length });
}
