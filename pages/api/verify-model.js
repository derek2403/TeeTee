export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Clean up the URL and ensure it ends with a trailing slash if needed
    let baseUrl = url.trim();
    if (!baseUrl.endsWith('/')) {
      baseUrl = baseUrl + '/';
    }

    // Append 'verify' to the URL
    const verifyUrl = `${baseUrl}verify`;
    console.log(`Server verifying model at: ${verifyUrl}`);

    // Make the request from the server side
    const response = await fetch(verifyUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to verify model URL: ${response.statusText}` 
      });
    }

    // Get the response data
    const data = await response.json();
    
    // Return the data to the client
    return res.status(200).json(data);
  } catch (error) {
    console.error('API verification error:', error);
    return res.status(500).json({ error: error.message });
  }
} 