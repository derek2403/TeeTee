import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ContributionPoolModal({ isOpen, onClose, selectedNode, isConnected, address }) {
  const [modalTab, setModalTab] = useState('instructions'); // 'instructions' or 'submit'
  const [nodeIP, setNodeIP] = useState('');
  const [modelHash, setModelHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset state when modal is closed
  const handleClose = () => {
    setModalTab('instructions');
    setNodeIP('');
    setModelHash('');
    setIsSubmitting(false);
    onClose();
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
      handleClose();
    }, 1500);
  };
  
  // Format wallet address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
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
                To host a TEE Node for TinyLlama-1.1B-Chat-v1.0, you&apos;ll need to follow our setup instructions on GitHub.
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
              <Button color="danger" variant="light" onPress={handleClose}>
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
              <Button color="danger" variant="light" onPress={handleClose}>
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
  );
} 