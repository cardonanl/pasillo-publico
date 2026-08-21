import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pasillo Público — Arte al alcance de todos y todas.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function fetchFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700",
      { headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" } }
    ).then((r) => r.text());

    const match = css.match(/url\((.+?\.ttf)\)/);
    if (!match) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const font = await fetchFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          fontFamily: font ? "Playfair Display" : "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Barra superior amarilla */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "10px",
            background: "#FEC70B",
          }}
        />

        {/* Estrellas decorativas */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginBottom: "28px",
            fontSize: "40px",
            color: "#FEC70B",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 32 32">
            <path
              d="M16,6 L17.4,14.6 L26,16 L17.4,17.4 L16,26 L14.6,17.4 L6,16 L14.6,14.6 Z"
              fill="#FEC70B"
            />
          </svg>
          <svg width="36" height="36" viewBox="0 0 32 32">
            <path
              d="M16,6 L17.4,14.6 L26,16 L17.4,17.4 L16,26 L14.6,17.4 L6,16 L14.6,14.6 Z"
              fill="#FEC70B"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "18px",
          }}
        >
          <span
            style={{
              fontSize: "100px",
              fontWeight: 700,
              color: "#0A0A0A",
              lineHeight: 1,
              letterSpacing: "-3px",
            }}
          >
            Pasillo
          </span>
          <span
            style={{
              fontSize: "100px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#1AA6C9",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            Público
          </span>
        </div>

        {/* Lema */}
        <div
          style={{
            marginTop: "28px",
            fontSize: "30px",
            fontStyle: "italic",
            fontWeight: 400,
            color: "#0A0A0A",
          }}
        >
          Arte al alcance de todos y todas.
        </div>

        {/* Localización */}
        <div
          style={{
            marginTop: "20px",
            fontSize: "14px",
            letterSpacing: "5px",
            textTransform: "uppercase",
            color: "#777777",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 400,
          }}
        >
          Cali · Valle del Cauca · Colombia
        </div>

        {/* Barra inferior negra */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "10px",
            background: "#0A0A0A",
          }}
        />
      </div>
    ),
    {
      ...size,
      ...(font
        ? {
            fonts: [
              {
                name: "Playfair Display",
                data: font,
                style: "normal",
                weight: 700,
              },
            ],
          }
        : {}),
    }
  );
}
