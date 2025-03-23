export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Call the Node2 API directly to generate
    const response = await fetch(
      "https://2ac100b57f58fc36993159c1d069cc33b10e8d3f-5001.dstack-prod5.phala.network/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          // Include minimal hidden_states and input_ids to make the API work
          "hidden_states": [[[0.1, 0.2, 0.3, 0.4, 0.5]]],
          "input_ids": [[101, 7592, 1010, 2040, 2024, 3835, 1029, 102]]
        }),
      }
    );

    const data = await response.json();
    
    // Return the FULL response including attestation with all fields preserved
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying request:", error);
    return res.status(500).json({ error: "Failed to proxy request" });
  }
} 