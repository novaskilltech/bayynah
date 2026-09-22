import { ImageResponse } from "next/og";

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
          borderRadius: 14,
          background: "#123f35",
          color: "#fbf9f5",
          fontSize: 42,
          fontWeight: 800,
          border: "3px solid #d3b36a",
        }}
      >
        T
      </div>
    ),
    size
  );
}
