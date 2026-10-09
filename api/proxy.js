export default async function handler(req, res) {
  const { url, name } = req.query;

  if (!url) {
    return res.status(400).send("Image URL is required");
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    const fileName = name || 'tikclip-slide.jpg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).send("Error downloading image file");
  }
}