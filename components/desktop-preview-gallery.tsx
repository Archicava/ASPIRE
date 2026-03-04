"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type DesktopPreview = {
  src: string;
  alt: string;
};

export function DesktopPreviewGallery({ previews }: { previews: DesktopPreview[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const totalPreviews = previews.length;

  const cycleSelection = (step: number) => {
    if (totalPreviews < 2) return;
    setSelectedIndex((current) => {
      if (current === null) return 0;
      return (current + step + totalPreviews) % totalPreviews;
    });
  };

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (totalPreviews < 2) return;
        setSelectedIndex((current) => {
          if (current === null) return 0;
          return (current + 1) % totalPreviews;
        });
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (totalPreviews < 2) return;
        setSelectedIndex((current) => {
          if (current === null) return 0;
          return (current - 1 + totalPreviews) % totalPreviews;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex, totalPreviews]);

  if (!totalPreviews) {
    return (
      <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
        Preview images are unavailable right now.
      </p>
    );
  }

  const activePreview = selectedIndex !== null ? previews[selectedIndex] : null;
  const activePreviewIndex = selectedIndex ?? 0;

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: "0.65rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        }}
      >
        {previews.map((preview, index) => (
          <button
            key={preview.src}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`Open preview ${index + 1} in zoom view`}
            style={{
              margin: 0,
              padding: 0,
              borderRadius: "0.85rem",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.94)",
              cursor: "zoom-in",
              textAlign: "left",
              display: "grid",
              gap: 0,
              boxShadow: "0 10px 24px rgba(11, 28, 61, 0.08)",
            }}
          >
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10" }}>
              <Image
                src={preview.src}
                alt={preview.alt}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                padding: "0.45rem 0.6rem",
                borderTop: "1px solid rgba(37, 99, 235, 0.2)",
              }}
            >
              Preview {index + 1} - Click to zoom
            </span>
          </button>
        ))}
      </div>

      {activePreview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Desktop client preview zoom"
          onClick={() => setSelectedIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(11, 28, 61, 0.72)",
            display: "grid",
            placeItems: "center",
            zIndex: 1400,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1080px, 94vw)",
              padding: "0.8rem",
              display: "grid",
              gap: "0.7rem",
              borderRadius: "1rem",
              background: "rgba(246, 250, 255, 0.98)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.6rem",
                flexWrap: "wrap",
              }}
            >
              <p className="section-title" style={{ margin: 0 }}>
                Preview {activePreviewIndex + 1} of {totalPreviews}
              </p>
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                style={{
                  border: "1px solid var(--color-border)",
                  background: "white",
                  color: "var(--color-text)",
                  borderRadius: "0.65rem",
                  padding: "0.4rem 0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                borderRadius: "0.8rem",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                background: "rgba(217, 230, 253, 0.58)",
              }}
            >
              <Image
                src={activePreview.src}
                alt={activePreview.alt}
                fill
                priority
                sizes="94vw"
                style={{ objectFit: "contain" }}
              />
            </div>

            {totalPreviews > 1 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => cycleSelection(-1)}
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "white",
                    color: "var(--color-text)",
                    borderRadius: "0.65rem",
                    padding: "0.4rem 0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => cycleSelection(1)}
                  style={{
                    border: "1px solid rgba(29, 78, 216, 0.35)",
                    background: "var(--color-accent)",
                    color: "white",
                    borderRadius: "0.65rem",
                    padding: "0.4rem 0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
