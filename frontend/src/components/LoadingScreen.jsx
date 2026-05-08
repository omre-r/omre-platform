import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import mixologyLoader from "../assets/mixology-loader.json";

export default function LoadingScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1000);
    const doneTimer = setTimeout(() => onDone?.(), 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(180deg, #f3e6dc 0%, #e0bfae 22%, #b07a63 45%, #6b2e22 70%, #3b1a12 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.8s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <Lottie
        animationData={mixologyLoader}
        loop={true}
        style={{ width: "380px", height: "380px" }}
      />
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 600,
          fontSize: "1.4rem",
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: "#f3e6dc",
          margin: "0 0 0.75rem 0",
        }}
      >
        Crafting your experience
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "rgba(151,33,0,0.9)",
              animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40%           { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
