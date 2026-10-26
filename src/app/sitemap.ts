import type { MetadataRoute } from "next";
import { site } from "@/content/profile";
import { pageFiles } from "@/content/workspace";

export default function sitemap(): MetadataRoute.Sitemap {
  return pageFiles.map((file) => ({
    url: `${site.url}${file.href === "/" ? "" : file.href}`,
    changeFrequency: "monthly",
    priority: file.href === "/" ? 1 : 0.7,
  }));
}
