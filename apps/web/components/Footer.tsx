export default function Footer() {
  return (
    <footer style={{ background: "#0F2744", padding: "32px 40px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <a href="/" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 800, fontSize: "20px", letterSpacing: "-0.7px", textDecoration: "none", color: "#FFFFFF" }}>
          Busco<span style={{ color: "#60A5FA" }}>Trabajito</span>
        </a>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>
          © 2026 BuscoTrabajito · México y LATAM
        </p>
      </div>
    </footer>
  );
}
