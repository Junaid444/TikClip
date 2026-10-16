
const isAllowedHost = (hostname, allowedHosts) =>
  allowedHosts.some(
    (host) => hostname.toLowerCase() === host
  );

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET." });
  }

  const rawUrl = req.query?.url;

  if (typeof rawUrl !== "string" || rawUrl.length > 2048) {
    return res.status(400).json({
      error: "Provide one valid direct media URL."
    });
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL." });
  }

  const allowedHosts = (process.env.DIRECT_MEDIA_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !isAllowedHost(url.hostname, allowedHosts)
  ) {
    return res.status(403).json({
      error: "This media host is not approved."
    });
  }

  // Return a link, not the media bytes. This avoids using
  // a Vercel Function as a large-file streaming proxy.
  return res.status(200).json({
    ok: true,
    downloadUrl: url.href,
    message:
      "Open this direct media link only if you have permission to download it."
  });
}
