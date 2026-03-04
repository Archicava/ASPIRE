import { DesktopPreviewGallery } from "@/components/desktop-preview-gallery";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

type GitHubAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GitHubRelease = {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
  assets: GitHubAsset[];
};

const RELEASES_API = "https://api.github.com/repos/Archicava/ASPIRE-Desktop/releases/latest";
const PREVIEW_IMAGES = [
  { src: "/1.png", alt: "Aspire desktop client preview 1" },
  { src: "/2.png", alt: "Aspire desktop client preview 2" },
  { src: "/3.png", alt: "Aspire desktop client preview 3" },
  { src: "/4.png", alt: "Aspire desktop client preview 4" },
];

export const revalidate = 300;

async function getLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(RELEASES_API, {
      next: { revalidate },
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as GitHubRelease;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().slice(0, 10);
}

function pickAsset(assets: GitHubAsset[], pattern: RegExp): GitHubAsset | null {
  return assets.find((asset) => pattern.test(asset.name)) ?? null;
}

export default async function DownloadPage() {
  const release = await getLatestRelease();
  const assets = release?.assets ?? [];

  const macDmg =
    pickAsset(assets, /arm64.*\.dmg$/i) ??
    pickAsset(assets, /\.dmg$/i);
  const macZip =
    pickAsset(assets, /arm64.*\.zip$/i) ??
    pickAsset(assets, /-mac\.zip$/i);
  const windowsExe = pickAsset(assets, /\.exe$/i);

  const releaseInfo = [
    { label: "Version", value: release?.tag_name ?? "Unavailable" },
    {
      label: "Last updated",
      value: release?.published_at ? formatDate(release.published_at) : "Unavailable",
    },
    { label: "Channel", value: release?.prerelease ? "Prerelease" : "Stable" },
    { label: "Source", value: "GitHub Releases" },
  ];

  const hasDownloads = Boolean(macDmg || macZip || windowsExe);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "transparent",
      }}
    >
      <Navbar />
      <main
        className="page-shell-flex"
        style={{ justifyItems: "center", paddingBottom: "2rem" }}
      >
        <section
          className="card"
          style={{
            width: "min(760px, 100%)",
            padding: "clamp(0.85rem, 2.8vw, 1.1rem)",
            display: "grid",
            gap: "0.8rem",
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
            {release?.tag_name ? (
              <a
                href={`https://github.com/Archicava/ASPIRE-Desktop/releases/tag/${release.tag_name}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  border: "1px solid rgba(29, 78, 216, 0.35)",
                  background: "var(--color-accent)",
                  color: "white",
                  borderRadius: "0.75rem",
                  padding: "0.45rem 0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View release
              </a>
            ) : null}
          </div>

          {!release ? (
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              Latest release could not be loaded right now. Please check back or open the repository directly.
            </p>
          ) : null}

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

          <div style={{ display: "grid", gap: "0.45rem" }}>
            <p className="section-title" style={{ margin: 0 }}>
              Downloads
            </p>
            {hasDownloads ? (
              <div style={{ display: "grid", gap: "0.45rem" }}>
                {macDmg ? (
                  <DownloadLink
                    label="macOS (DMG)"
                    href={macDmg.browser_download_url}
                    fileName={macDmg.name}
                    size={formatBytes(macDmg.size)}
                  />
                ) : null}
                {macZip ? (
                  <DownloadLink
                    label="macOS (ZIP)"
                    href={macZip.browser_download_url}
                    fileName={macZip.name}
                    size={formatBytes(macZip.size)}
                  />
                ) : null}
                {windowsExe ? (
                  <DownloadLink
                    label="Windows (EXE)"
                    href={windowsExe.browser_download_url}
                    fileName={windowsExe.name}
                    size={formatBytes(windowsExe.size)}
                  />
                ) : null}
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                No binary assets found in the latest release.
              </p>
            )}
          </div>

          <div style={{ display: "grid", gap: "0.45rem" }}>
            <p className="section-title" style={{ margin: 0 }}>
              Desktop client
            </p>
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              The Aspire desktop client facilitates interaction with your local environment so you can
              launch workflows, access release builds, and stay in control of your case workspace.
            </p>
            <DesktopPreviewGallery previews={PREVIEW_IMAGES} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DownloadLink({
  label,
  href,
  fileName,
  size,
}: {
  label: string;
  href: string;
  fileName: string;
  size: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.45rem 0.55rem",
        borderRadius: "0.65rem",
        border: "1px solid var(--color-border)",
        background: "rgba(255, 255, 255, 0.75)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
        {fileName} • {size}
      </span>
    </a>
  );
}
