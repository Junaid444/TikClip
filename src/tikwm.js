export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const cleanUrl = url.split('?')[0];
    const tikwmResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await tikwmResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch media from TikWM" });
  }
}