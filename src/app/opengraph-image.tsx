import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        background: "#040A14",
        color: "#F5F8FC",
        padding: "54px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 82% 12%, rgba(95, 167, 255, 0.18), transparent 30%), radial-gradient(circle at 8% 0%, rgba(95, 167, 255, 0.12), transparent 32%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(95, 167, 255, 0.18)",
          borderRadius: "36px",
          background:
            "linear-gradient(180deg, rgba(7, 17, 31, 0.96), rgba(7, 17, 31, 0.88))",
          padding: "44px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              height: "96px",
              width: "96px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "28px",
              border: "1px solid #214367",
              background: "#07111F",
            }}
          >
            <svg
              width="72"
              height="72"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="4" width="56" height="56" rx="18" fill="#07111F" />
              <rect
                x="4.75"
                y="4.75"
                width="54.5"
                height="54.5"
                rx="17.25"
                stroke="#214367"
                strokeWidth="1.5"
              />
              <circle
                cx="32"
                cy="32"
                r="22"
                stroke="#5FA7FF"
                strokeWidth="1.5"
                opacity="0.14"
              />
              <circle
                cx="32"
                cy="32"
                r="14"
                stroke="#5FA7FF"
                strokeWidth="1.5"
                opacity="0.28"
              />
              <path
                d="M17 40L25 34L31 37L41 23L47 28"
                stroke="#86C4FF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="47" cy="28" r="5" fill="#9DD0FF" />
              <circle
                cx="47"
                cy="28"
                r="8.5"
                stroke="#9DD0FF"
                strokeWidth="1.5"
                opacity="0.35"
              />
              <path
                d="M19 46H45"
                stroke="#5FA7FF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.24"
              />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                color: "#5FA7FF",
                fontSize: "18px",
                letterSpacing: "0.34em",
                textTransform: "uppercase",
              }}
            >
              Forecast social
            </div>
            <div style={{ fontSize: "54px", fontWeight: 700 }}>
              REAL Severity Index
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: "920px",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ fontSize: "58px", fontWeight: 700, lineHeight: 1.06 }}>
            Forecasts gamificados e sinais coletivos para a comunidade tech.
          </div>
          <div style={{ color: "#C2D0E0", fontSize: "28px", lineHeight: 1.38 }}>
            Acompanhe lancamentos, incidentes e conviccao comunitaria com REAL
            Credits virtuais.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div
            style={{
              color: "#8FA3BB",
              fontSize: "20px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            sem saque • sem compra de dinheiro • sem payout
          </div>
          <div style={{ color: "#A7B9CF", fontSize: "22px" }}>
            Ranking, reputacao e radar comunitario
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
