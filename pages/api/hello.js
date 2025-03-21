import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Function to read API keys from JSON file
function getApiKeys() {
  try {
    // Get the absolute path to the api.json file
    const filePath = path.join(process.cwd(), 'api.json');
    
    // Read the file synchronously
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON content
    const data = JSON.parse(fileContents);
    
    // Return just the active keys
    return data.keys
      .filter(keyObj => keyObj.active)
      .map(keyObj => keyObj.key);
  } catch (error) {
    console.error('Error reading API keys file:', error);
    
    // If we can't read the file, return a default key for fallback
    return ['sk-tee-llm-123456789'];
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }
  
  // Extract the API key from the header
  const apiKey = authHeader.split(' ')[1];
  
  // Get the list of valid API keys
  const validApiKeys = getApiKeys();
  
  // Check if the provided API key is valid
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  try {
    // Get the prompt from the request body
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call your local LLM service
    const response = await axios.post('http://127.0.0.1:5002/process', {
      prompt: prompt
    }, {
      timeout: 300000 // 5 minute timeout
    });

    // Return the LLM response
    return res.status(200).json({ 
      response: response.data.output,
      model: "DeepHermes-3-Llama-3-3B-TEE-Split"
    });
  } catch (error) {
    console.error('Error calling LLM service:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
}
