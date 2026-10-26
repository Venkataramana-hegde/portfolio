import { ImageResponse } from "next/og";
import { person } from "@/content/profile";
import { palette } from "@/theme";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: palette.rail,
          color: palette.amber,
          border: `2px solid ${palette.line}`,
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: -5,
        }}
      >
        {person.givenName[0]}
        {person.familyName[0]}
      </div>
    ),
    size,
  );
}
