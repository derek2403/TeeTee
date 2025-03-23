import { useState, useEffect } from 'react';
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import Image from 'next/image';
import InstructionsModal from '../components/InstructionsModal';

export default function Models() {
  const [publisher, setPublisher] = useState('all');
  const [capability, setCapability] = useState('all');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recently_added');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Pool Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    modelUrl: '',
    icon: '',
    numberOfNodes: 1, // Default to 1 node required
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Instructions Modal state
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
  useEffect(() => {
    // Fetch models from API
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewModel(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreatePool = async () => {
    if (!newModel.name || !newModel.modelUrl || !newModel.numberOfNodes) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Ensure numberOfNodes is a number and at least 1
    const numberOfNodes = parseInt(newModel.numberOfNodes);
    if (isNaN(numberOfNodes) || numberOfNodes < 1) {
      alert('Number of hosts must be at least 1');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newModel,
          numberOfNodes: numberOfNodes
        })
      });
      
      if (!response.ok) throw new Error('Failed to create model pool');
      
      // Reset form and close modal
      const createdModel = await response.json();
      setModels(prev => [...prev, createdModel]);
      setNewModel({
        name: '',
        description: '',
        modelUrl: '',
        icon: '',
        numberOfNodes: 1
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating model pool:', error);
      alert('Failed to create model pool');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleModelClick = (model) => {
    console.log("Model clicked:", model.name);
    setSelectedModel(model);
    setIsInstructionsOpen(true);
  };
  
  // Format wallet address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Models</h1>
            <p className="text-gray-600">
              Try, test, and deploy from a wide range of model types, sizes, and specializations. 
              <a href="#" className="text-blue-600 ml-1">Learn more</a>.
            </p>
          </div>
          <Button color="primary" onClick={() => setIsModalOpen(true)}>
            Create Pool
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Select
            label="Publisher"
            className="w-32"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          >
            <SelectItem key="all" value="all">All</SelectItem>
            <SelectItem key="mistral" value="mistral">Mistral</SelectItem>
            <SelectItem key="microsoft" value="microsoft">Microsoft</SelectItem>
            <SelectItem key="openai" value="openai">OpenAI</SelectItem>
            <SelectItem key="deepseek" value="deepseek">DeepSeek</SelectItem>
          </Select>

          <Select
            label="Capability"
            className="w-32"
            value={capability}
            onChange={(e) => setCapability(e.target.value)}
          >
            <SelectItem key="all" value="all">All</SelectItem>
            <SelectItem key="reasoning" value="reasoning">Reasoning</SelectItem>
            <SelectItem key="coding" value="coding">Coding</SelectItem>
            <SelectItem key="multimodal" value="multimodal">Multimodal</SelectItem>
          </Select>

          <Select
            label="Category"
            className="w-32"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <SelectItem key="all" value="all">All</SelectItem>
            <SelectItem key="large" value="large">Large</SelectItem>
            <SelectItem key="small" value="small">Small</SelectItem>
            <SelectItem key="mini" value="mini">Mini</SelectItem>
          </Select>

          <Select
            label="Sort"
            className="w-48"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <SelectItem key="recently_added" value="recently_added">Recently added</SelectItem>
            <SelectItem key="name_asc" value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem key="name_desc" value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem key="size_asc" value="size_asc">Size (smallest first)</SelectItem>
            <SelectItem key="size_desc" value="size_desc">Size (largest first)</SelectItem>
          </Select>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <p>Loading models...</p>
          </div>
        )}

        {/* Models Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model) => (
              <div onClick={() => handleModelClick(model)}>
                <Card 
                  key={model.id} 
                  className="w-full cursor-pointer hover:shadow-md transition-shadow" 
                  shadow="sm"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                        <div className="relative w-8 h-8">
                          {/* For a real implementation, you'd need actual model icons */}
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            {model.name.charAt(0)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{model.name}</h3>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">Model</span>
                          </div>
                          
                          {/* Active status indicator */}
                          {model.numberOfNodes && model.hostAddresses && 
                            model.numberOfNodes === model.hostAddresses.length && (
                              <div className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <span className="text-xs text-green-600">Active</span>
                              </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                        
                        {/* Host information */}
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Hosted by {model.hostAddresses.length} node(s)
                            {model.numberOfNodes && ` of ${model.numberOfNodes} required`}
                          </p>
                          {model.hostAddresses.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {model.hostAddresses.map((address, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {formatAddress(address)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add a button at the bottom */}
                    <div className="mt-3 flex justify-end">
                      <Button 
                        color="primary" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          handleModelClick(model);
                        }}
                      >
                        View Instructions
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Pool Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Create Model Pool</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Model Name"
                placeholder="Enter model name"
                name="name"
                value={newModel.name}
                onChange={handleInputChange}
                isRequired
              />
              
              <Textarea
                label="Description"
                placeholder="Enter model description"
                name="description"
                value={newModel.description}
                onChange={handleInputChange}
              />
              
              <Input
                label="Model URL"
                placeholder="Enter model API URL"
                name="modelUrl"
                value={newModel.modelUrl}
                onChange={handleInputChange}
                isRequired
              />
              
              <Input
                label="Icon Path (optional)"
                placeholder="Path to model icon"
                name="icon"
                value={newModel.icon}
                onChange={handleInputChange}
              />
              
              <Input
                type="number"
                label="Number of Hosts Required"
                placeholder="Enter number of hosts needed"
                name="numberOfNodes"
                value={newModel.numberOfNodes}
                onChange={handleInputChange}
                min={1}
                isRequired
              />
              
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium mb-2">Host Addresses</p>
                <p className="text-xs text-gray-600">Host addresses cannot be filled at creation. Hosts will join your pool after creation.</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium mb-2">Node URL</p>
                <p className="text-xs text-gray-600">The Node URL will be generated automatically once all required hosts have joined.</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleCreatePool}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || !newModel.name || !newModel.description || !newModel.modelUrl}
            >
              {isSubmitting ? 'Creating...' : 'Create Pool'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Instructions Modal */}
      <InstructionsModal 
        isOpen={isInstructionsOpen} 
        onClose={() => setIsInstructionsOpen(false)} 
        model={selectedModel}
      />
    </div>
  );
} 