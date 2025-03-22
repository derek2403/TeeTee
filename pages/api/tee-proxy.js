export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      "https://0c8426248007674742be42b5c597a7cb9210a300-5002.dstack-prod5.phala.network/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying request:", error);
    return res.status(500).json({ error: "Failed to fetch from TEE endpoint" });
  }
} 