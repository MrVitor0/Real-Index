import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#040A14",
        borderRadius: "40px",
      }}
    >
      <svg
        width="120"
        height="120"
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
          stroke-width="1.5"
        />
        <circle
          cx="32"
          cy="32"
          r="22"
          stroke="#5FA7FF"
          stroke-width="1.5"
          opacity="0.14"
        />
        <circle
          cx="32"
          cy="32"
          r="14"
          stroke="#5FA7FF"
          stroke-width="1.5"
          opacity="0.28"
        />
        <path
          d="M17 40L25 34L31 37L41 23L47 28"
          stroke="#86C4FF"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="47" cy="28" r="5" fill="#9DD0FF" />
        <circle
          cx="47"
          cy="28"
          r="8.5"
          stroke="#9DD0FF"
          stroke-width="1.5"
          opacity="0.35"
        />
      </svg>
    </div>,
    { ...size },
  );
}
