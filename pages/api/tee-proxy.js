export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Call the Node1 API to get hidden states and then Node2 to generate
    const response = await fetch(
      "https://e3c329acf714051138becd9199470e6d1ae0cabd-5002.dstack-prod5.phala.network/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      }
    );

    const data = await response.json();
    
    // Return the FULL response including attestation
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying request:", error);
    return res.status(500).json({ error: "Failed to proxy request" });
  }
} 