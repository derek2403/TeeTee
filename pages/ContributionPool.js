import { useState } from 'react';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function ContributionPool() {
  const { isConnected, address } = useAccount();
  const [selectedModel, setSelectedModel] = useState('llama3');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalTab, setModalTab] = useState('instructions'); // 'instructions' or 'submit'
  const [nodeIP, setNodeIP] = useState('');
  const [modelHash, setModelHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock data for the TEE nodes
  const teeNodes = [
    { id: 1, status: 'occupied', address: '0x97...A8f1', model: 'llama3' },
    { id: 2, status: 'empty', model: 'llama3' },
  ];
  
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };
  
  const openHostModal = (node) => {
    setSelectedNode(node);
    setModalTab('instructions');
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
    setNodeIP('');
    setModelHash('');
    setModalTab('instructions');
  };
  
  const goToGitHub = () => {
    window.open('https://github.com/TEE-AI/setup-instructions', '_blank');
    // Don't close the modal, let the user decide
  };
  
  const handleSubmit = () => {
    if (!isConnected || !nodeIP || !modelHash) return;
    
    setIsSubmitting(true);
    
    // Mock form submission
    setTimeout(() => {
      alert(`Node #${selectedNode.id} registration submitted! We'll review your hosting request shortly.`);
      setIsSubmitting(false);
      closeModal();
    }, 1500);
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
            <SelectItem key="llama3" value="llama3">Llama 3.2 (2 TEE Nodes)</SelectItem>
          </Select>
          <p className="text-sm text-gray-600 mt-2">
            More models will be available soon. Currently only Llama 3.2 is supported.
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
                    <p className="text-sm text-gray-600 mb-3">Model: Llama 3.2</p>
                    
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
      
      {/* Hosting Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Host TEE Node #{selectedNode?.id}
          </ModalHeader>
          
          <Tabs 
            aria-label="Options" 
            selectedKey={modalTab}
            onSelectionChange={setModalTab}
            className="w-full px-3"
            variant="underlined"
            color="primary"
          >
            <Tab key="instructions" title="Setup Instructions">
              <ModalBody>
                <p>
                  To host a TEE Node for Llama 3.2, you&apos;ll need to follow our setup instructions on GitHub.
                </p>
                <div className="p-4 bg-blue-50 rounded-md my-3">
                  <h3 className="font-medium text-blue-800 mb-2">GitHub Setup Includes:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-blue-700">
                    <li>TEE environment configuration</li>
                    <li>Model download and installation</li>
                    <li>Network connection setup</li>
                    <li>Wallet connection instructions</li>
                  </ul>
                </div>
                <p className="mt-2">
                  Click the GitHub button to view detailed instructions, or switch to the &quot;Submit Details&quot; tab if you&apos;ve already completed the setup.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={closeModal}>
                  Cancel
                </Button>
                <Button color="primary" onPress={goToGitHub}>
                  Go to GitHub Instructions
                </Button>
              </ModalFooter>
            </Tab>
            
            <Tab key="submit" title="Submit Details">
              <ModalBody>
                <p className="mb-4">
                  After completing the setup from GitHub instructions, please submit your node details below:
                </p>
                
                {/* Wallet Connection - Using the system's wallet connection */}
                <div className="mb-5">
                  <h3 className="text-md font-medium mb-2">Wallet Details</h3>
                  
                  {isConnected ? (
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                      <div>
                        <p className="text-sm font-medium">Connected Wallet</p>
                        <p className="font-mono text-xs">{formatAddress(address)}</p>
                      </div>
                      <div className="ml-3">
                        <ConnectButton />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-md mb-3">
                      <p className="text-sm text-yellow-800 mb-2">
                        You need to connect your wallet to host a TEE node.
                      </p>
                      <div className="flex justify-center">
                        <ConnectButton />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Node Details Form */}
                <div className="space-y-4">
                  <Input
                    label="Node IP Address"
                    placeholder="Enter your node's IP address"
                    value={nodeIP}
                    onChange={(e) => setNodeIP(e.target.value)}
                    isRequired
                  />
                  
                  <Input
                    label="Model Hash"
                    placeholder="Enter the model hash from setup"
                    value={modelHash}
                    onChange={(e) => setModelHash(e.target.value)}
                    isRequired
                  />
                  
                  <Input
                    label="Port (optional)"
                    placeholder="Node port if not using default"
                    type="number"
                  />
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 rounded-md text-sm text-yellow-800">
                  <p>⚠️ Please ensure all details are correct. Incorrect information may result in your node not being properly connected to the network.</p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={closeModal}>
                  Cancel
                </Button>
                <Button 
                  color="success" 
                  onPress={handleSubmit}
                  isDisabled={!isConnected || !nodeIP || !modelHash || isSubmitting}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Node Details"}
                </Button>
              </ModalFooter>
            </Tab>
          </Tabs>
        </ModalContent>
      </Modal>
    </div>
  );
} 