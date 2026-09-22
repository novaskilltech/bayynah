import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };

export function createSocialImage(locale: string) {
  const isArabic = locale === "ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#fbf9f5",
          color: "#0f1723",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "#dcebe4",
            right: -120,
            top: -150,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: 999,
            border: "30px solid #eadcb8",
            left: -90,
            bottom: -120,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#123f35",
                color: "#fbf9f5",
                border: "4px solid #d3b36a",
                fontSize: 48,
                fontWeight: 800,
              }}
            >
              T
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 29, fontWeight: 800, letterSpacing: 5 }}>TABAYYUN</span>
              <span style={{ fontSize: 20, color: "#66736d" }}>تَبَيُّن</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              border: "2px solid #b8ccc2",
              color: "#123f35",
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            {isArabic ? "MANHAJ AT-TATHABBUT" : "Méthode de vérification"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isArabic ? "flex-end" : "flex-start",
            position: "relative",
            maxWidth: 980,
            gap: 20,
            textAlign: isArabic ? "right" : "left",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: isArabic ? 68 : 61,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: isArabic ? 0 : -2,
            }}
          >
            {isArabic
              ? "TABAYYUN"
              : "Apprendre à vérifier avant d’affirmer"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              lineHeight: 1.4,
              color: "#4b5b55",
              maxWidth: 900,
            }}
          >
            {isArabic
              ? "Dalil → naql → fahm → istidlal → hukm"
              : "La preuve → la transmission → la compréhension → le raisonnement → la conclusion"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            color: "#66736d",
            fontSize: 18,
          }}
        >
          <span>bayynah-two.vercel.app</span>
          <span>{isArabic ? "Tathabbat qabla an tanqul" : "Vérifier avant de transmettre"}</span>
        </div>
      </div>
    ),
    socialImageSize
  );
}
