import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Read model.json file
    const filePath = path.join(process.cwd(), 'utils', 'model.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const models = JSON.parse(fileData);
    
    return res.status(200).json(models);
  } else if (req.method === 'POST') {
    // Handle creating a new model pool
    const { name, description, modelUrl, icon, numberOfNodes } = req.body;
    
    // Read existing models
    const filePath = path.join(process.cwd(), 'utils', 'model.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const models = JSON.parse(fileData);
    
    // Create new model
    const newModel = {
      id: models.length + 1,
      name,
      description: description || `A model for ${name}`,
      icon: icon || `/model-icons/default.png`,
      modelUrl,
      numberOfNodes: parseInt(numberOfNodes) || 1,
      hostAddresses: [], // Start with an empty array
      // nodeURL will be generated later when hosts join
    };
    
    // Add to models array
    models.push(newModel);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(models, null, 2), 'utf8');
    
    return res.status(201).json(newModel);
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 