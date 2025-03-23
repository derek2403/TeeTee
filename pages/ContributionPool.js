import { useState } from 'react';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { useAccount } from 'wagmi';
import ContributionPoolModal from '../components/ContributionPoolModal';

export default function ContributionPool() {
  const { isConnected, address } = useAccount();
  const [selectedModel, setSelectedModel] = useState('tinyllama');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Mock data for the TEE nodes
  const teeNodes = [
    { id: 1, status: 'empty', address: '', model: 'TinyLlama-1.1B-Chat-v1.0' },
    { id: 2, status: 'occupied', address: '0xf1a...9092', model: 'TinyLlama-1.1B-Chat-v1.0' },
  ];
  
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };
  
  const openHostModal = (node) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };
  
  // Format wallet address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto my-8">
        <h1 className="text-3xl font-bold mb-6">Contribution Pool</h1>
        
        <Card shadow="sm" className="w-full mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Join the TeeTee Contribution Network</h2>
          </CardHeader>
          <CardBody>
            <p className="mb-6">
              Contribute your own TEE resources to our network and get access to the entire distributed system.
              Ideal for those who can provide computational resources and want to be part of the TEE network.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-md border mb-6">
              <h3 className="font-medium mb-2">Benefits of Contributing</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Earn tokens based on your contribution</li>
                <li>Access to the entire distributed network</li>
                <li>Participate in network governance</li>
                <li>Help build a decentralized AI infrastructure</li>
              </ul>
            </div>
          </CardBody>
        </Card>
        
        {/* Model Selection */}
        <div className="mb-6">
          <Select
            isRequired
            label="Select a model to contribute"
            placeholder="Choose LLM model"
            className="max-w-xs"
            value={selectedModel}
            onChange={handleModelChange}
          >
            <SelectItem key="tinyllama" value="tinyllama">TinyLlama-1.1B-Chat-v1.0 (2 TEE Nodes)</SelectItem>
          </Select>
          <p className="text-sm text-gray-600 mt-2">
            More models will be available soon. Currently only TinyLlama-1.1B-Chat-v1.0 is supported.
          </p>
        </div>
        
        {/* TEE Nodes Visualization */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available TEE Nodes</h2>
          <div className="flex justify-center gap-8">
            {teeNodes.map((node) => (
              <Card 
                key={node.id} 
                className={`border-2 ${node.status === 'occupied' ? 'border-blue-400' : 'border-dashed border-gray-300'} w-full max-w-xs`}
                shadow="sm"
              >
                <CardBody className="p-4">
                  <div className="aspect-square flex flex-col items-center justify-center text-center p-3">
                    <div className="w-16 h-16 mb-3 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">#{node.id}</span>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-1">TEE Node {node.id}</h3>
                    <p className="text-sm text-gray-600 mb-3">Model: TinyLlama-1.1B-Chat-v1.0</p>
                    
                    {node.status === 'occupied' ? (
                      <div className="mt-auto">
                        <div className="bg-blue-50 p-2 rounded-md">
                          <p className="text-xs text-gray-700">Hosted by</p>
                          <p className="font-mono text-sm">{node.address}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <Button 
                          color="primary" 
                          onClick={() => openHostModal(node)}
                          className="w-full"
                        >
                          Host This Node
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Network Stats */}
        <Card shadow="sm" className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">Network Statistics</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Active Nodes</p>
                <p className="text-2xl font-bold">1/2</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Network Uptime</p>
                <p className="text-2xl font-bold">99.8%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Contributors</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Hosting Modal as a separate component */}
      <ContributionPoolModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        selectedNode={selectedNode}
        isConnected={isConnected}
        address={address}
      />
    </div>
  );
} 