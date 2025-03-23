import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get all models to know which are being hosted
    const modelsPath = path.join(process.cwd(), 'utils', 'model.json');
    const modelsData = fs.readFileSync(modelsPath, 'utf8');
    const models = JSON.parse(modelsData);
    
    // Generate nodes based on models data
    // In a real app, you'd fetch this from a database
    const nodes = [];
    
    // Create a pool of 10 nodes
    for (let i = 1; i <= 10; i++) {
      // Determine if this node is hosting any model
      let nodeStatus = 'empty';
      let hostedModel = null;
      
      // Check if this node is in any model's hostAddresses
      for (const model of models) {
        if (model.hostAddresses.some(addr => addr.includes(`${i}`))) {
          nodeStatus = 'active';
          hostedModel = model.id;
          break;
        }
      }
      
      nodes.push({
        id: i,
        status: nodeStatus,
        model: hostedModel
      });
    }
    
    return res.status(200).json(nodes);
  } catch (error) {
    console.error('Error fetching TEE nodes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 