import { ImageResponse } from "next/og";
import { person } from "@/content/profile";
import { palette } from "@/theme";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: -2,
          borderRadius: 14,
        }}
      >
        {person.givenName[0]}
        {person.familyName[0]}
      </div>
    ),
    size,
  );
}
