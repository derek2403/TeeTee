import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const { modelId, walletAddress, nodeId } = req.body;
  
  if (!modelId || !walletAddress) {
    return res.status(400).json({ message: 'Model ID and wallet address are required' });
  }
  
  try {
    // Read the models file
    const filePath = path.join(process.cwd(), 'utils', 'model.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const models = JSON.parse(fileData);
    
    // Find the model to update
    const modelIndex = models.findIndex(m => m.id === parseInt(modelId));
    
    if (modelIndex === -1) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    // Check if this wallet is already hosting
    if (models[modelIndex].hostAddresses.includes(walletAddress)) {
      return res.status(400).json({ message: 'This wallet is already hosting the model' });
    }
    
    // Add the wallet address to the model's hostAddresses
    models[modelIndex].hostAddresses.push(walletAddress);
    
    // If all required nodes are now present, generate a nodeURL
    if (models[modelIndex].hostAddresses.length >= models[modelIndex].numberOfNodes && !models[modelIndex].nodeURL) {
      // In a real app, this would be a real URL based on your infrastructure
      models[modelIndex].nodeURL = `https://${Buffer.from(walletAddress).toString('hex').substr(0, 40)}-5002.dstack-prod5.phala.network`;
    }
    
    // Write the updated models back to the file
    fs.writeFileSync(filePath, JSON.stringify(models, null, 2), 'utf8');
    
    return res.status(200).json(models[modelIndex]);
  } catch (error) {
    console.error('Error hosting model:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 