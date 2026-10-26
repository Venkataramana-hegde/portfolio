import { ImageResponse } from "next/og";
import { person } from "@/content/profile";
import { palette as c } from "@/theme";

export const alt = `${person.name}, ${person.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site itself, reduced to one editor window with the hello tab open. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: c.bg, color: c.fg }}>
        {/* title bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56, background: c.rail, borderBottom: `2px solid ${c.line}`, paddingLeft: 28 }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 99, background: "#e99287" }} />
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 99, background: c.amber }} />
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 99, background: c.mint }} />
          <div style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 22, color: c.muted }}>
            {person.handle}
          </div>
        </div>

        {/* tab bar */}
        <div style={{ display: "flex", height: 52, background: c.panel, borderBottom: `2px solid ${c.line}`, alignItems: "stretch", fontSize: 21 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 24px", background: c.bg, borderTop: `3px solid ${c.amber}`, color: c.fg }}>
            <span style={{ color: c.blue, fontSize: 15, fontWeight: 700 }}>TS</span>_hello.tsx
          </div>
          {["_about-me.md", "_projects", "_contact-me.ts"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", padding: "0 24px", color: c.faint }}>
              {t}
            </div>
          ))}
        </div>

        {/* body */}
        <div style={{ display: "flex", flex: 1, padding: "0 60px", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 26, color: c.muted }}>Hi all. I am</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>{person.name}</div>
          <div style={{ display: "flex", fontSize: 32, color: c.blue }}>
            <span style={{ color: c.muted, marginRight: 10 }}>&gt;</span>
            {person.role}
            <span style={{ display: "flex", width: 16, height: 32, background: c.amber, marginLeft: 8 }} />
          </div>
          <div style={{ display: "flex", fontSize: 23, color: c.faint, marginTop: 8 }}>
            {`// reporting, billing and care-operations software at ${person.currentCompany}`}
          </div>
        </div>

        {/* status bar */}
        <div style={{ display: "flex", height: 44, background: c.rail, borderTop: `2px solid ${c.line}`, alignItems: "center", padding: "0 28px", gap: 32, fontSize: 19, color: c.muted }}>
          <span style={{ color: c.mint }}>main</span>
          <span>{person.stackSummary.join("  ")}</span>
          <span style={{ marginLeft: "auto" }}>{person.location}</span>
        </div>
      </div>
    ),
    size,
  );
}
