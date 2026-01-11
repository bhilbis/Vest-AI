import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Vest AI - AI-Powered Stock Analysis & Investment Tools";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: "bold",
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            Vest AI
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: "normal",
              opacity: 0.9,
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            AI-Powered Stock Analysis & Investment Tools
          </div>
          <div
            style={{
              fontSize: 32,
              marginTop: 40,
              opacity: 0.8,
              fontWeight: 300,
            }}
          >
            Smart Investment Decisions with AI
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
