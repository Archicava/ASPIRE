const releaseInfo = [
  { label: "Version", value: "1.8.2" },
  { label: "Size", value: "214 MB" },
  { label: "Last updated", value: "2026-01-29" },
  { label: "Channel", value: "Stable" },
];

export default function DownloadPage() {
  return (
    <main
      className="page-shell-flex"
      style={{ justifyItems: "center", paddingBottom: "2rem" }}
    >
      <section
        className="card"
        style={{
          width: "min(700px, 100%)",
          padding: "clamp(0.85rem, 2.8vw, 1.1rem)",
          display: "grid",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 3.5vw, 1.5rem)" }}>
            Download client
          </h1>
          <button
            type="button"
            disabled
            style={{
              border: "1px solid rgba(29, 78, 216, 0.35)",
              background: "var(--color-accent)",
              color: "white",
              borderRadius: "0.75rem",
              padding: "0.45rem 0.9rem",
              fontWeight: 600,
              cursor: "not-allowed",
              opacity: 0.85,
            }}
          >
            Download
          </button>
        </div>
        <div style={{ display: "grid", gap: "0.2rem" }}>
          <p className="section-title" style={{ margin: 0 }}>
            Release info
          </p>
          <dl
            style={{
              margin: 0,
              display: "grid",
              gap: "0.35rem",
            }}
          >
            {releaseInfo.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "0.65rem",
                  border: "1px solid var(--color-border)",
                  background: "rgba(255, 255, 255, 0.65)",
                }}
              >
                <dt
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    color: "var(--color-text-secondary)",
                    fontSize: "0.95rem",
                    lineHeight: 1.2,
                  }}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
