import { ImageResponse } from "next/og";

export const runtime = "edge";
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
          background: "#0A0A0A",
          borderRadius: "36px",
        }}
      >
        <svg width="108" height="108" viewBox="0 0 32 32">
          <path
            d="M16,6 L17.4,14.6 L26,16 L17.4,17.4 L16,26 L14.6,17.4 L6,16 L14.6,14.6 Z"
            fill="#FEC70B"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
