export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/{id} or /embed/{id}
      const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return id;
    }
    return null;
  } catch {
    return null;
  }
}

