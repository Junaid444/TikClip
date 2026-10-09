export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const cleanUrl = url.split('?')[0];

    // Attempt 1: Fetch via TikWM API (Server-Side)
    const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const tikData = await tikRes.json();

    if (tikData?.code === 0 && tikData?.data?.images && tikData.data.images.length > 0) {
      return res.status(200).json({ images: tikData.data.images });
    }

    // Attempt 2: Fallback via LoveTik API (Server-Side)
    const formData = new URLSearchParams();
    formData.append('query', cleanUrl);

    const loveRes = await fetch('https://lovetik.com/api/ajax/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: formData
    });

    const loveData = await loveRes.json();

    if (loveData?.status === 'ok' && loveData?.images && loveData.images.length > 0) {
      return res.status(200).json({ images: loveData.images });
    }

    return res.status(404).json({ error: "No photo slides found in this link." });

  } catch (err) {
    return res.status(500).json({ error: "Server error while fetching slides." });
  }
}