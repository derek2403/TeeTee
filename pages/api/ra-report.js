export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      "https://e3c329acf714051138becd9199470e6d1ae0cabd-5002.dstack-prod5.phala.network/node1_ra_report",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching Node1 RA report:", error);
    return res.status(500).json({ error: "Failed to fetch Node1 RA report" });
  }
}

