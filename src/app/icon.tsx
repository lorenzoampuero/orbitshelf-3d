import { ImageResponse } from "next/og";

// Image metadata
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated favicon/app icon: the orbit dot from the wordmark on the graphite
 * background, so the browser tab reads as OrbitShelf without shipping a binary asset.
 */
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
          background: "#0b0b0e",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: "#a78bfa",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
