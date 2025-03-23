import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ContributionPoolModal({ isOpen, onClose, selectedNode, isConnected, address }) {
  const [modalTab, setModalTab] = useState('instructions'); // 'instructions' or 'submit'
  const [modelUrl, setModelUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset state when modal is closed
  const handleClose = () => {
    setModalTab('instructions');
    setModelUrl('');
    setIsSubmitting(false);
    onClose();
  };
  
  const goToGitHub = () => {
    window.open('https://github.com/TEE-AI/setup-instructions', '_blank');
    // Don't close the modal, let the user decide
  };
  
  const handleSubmit = () => {
    if (!isConnected || !modelUrl) return;
    
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
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent className="max-h-[90vh] flex flex-col">
        <ModalHeader className="flex flex-col gap-0 py-3">
          <h3 className="text-lg font-semibold">Host TEE Node #{selectedNode?.id}</h3>
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
            <ModalBody className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <p className="text-sm">
                To host a TEE Node for TinyLlama-1.1B-Chat-v1.0, you&apos;ll need to follow our setup instructions on GitHub.
              </p>
              <div className="p-3 bg-blue-50 rounded-lg my-2">
                <h3 className="text-sm font-medium text-blue-800 mb-1">GitHub Setup Includes:</h3>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-blue-700">
                  <li>TEE environment configuration</li>
                  <li>Model download and installation</li>
                  <li>Network connection setup</li>
                  <li>Wallet connection instructions</li>
                </ul>
              </div>
              <p className="mt-2 text-sm">
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
            <ModalBody className="overflow-y-auto max-h-[calc(90vh-180px)]">
              <p className="mb-3 text-sm">
                After completing the setup from GitHub instructions, please submit your node details below:
              </p>
              
              {/* Wallet Connection - Using the system's wallet connection */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Wallet Details</h3>
                
                {isConnected ? (
                  <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200 cursor-not-allowed">
                    <div className="flex-grow">
                      <p className="text-sm">Connected Wallet</p>
                      <p className="font-mono text-sm text-gray-700">{formatAddress(address)}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <span className="text-sm font-medium">0.99 ETH</span>
                      <div className="ml-2 flex flex-col items-end">
                        <span className="text-xs flex items-center">
                          Base Sepolia 
                          <img 
                            src="/Base.png" 
                            alt="Base" 
                            className="ml-1 w-4 h-4 rounded-full"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-yellow-800 mb-2">
                      You need to connect your wallet to host a TEE node.
                    </p>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Simplified Form - Only Model URL */}
              <div className="space-y-4">
                <Input
                  label="Model URL"
                  placeholder="Enter the model URL"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  isRequired
                  className="rounded-lg"
                />
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                <p>⚠️ Please ensure the Model URL is correct. Incorrect information may result in your node not being properly connected to the network.</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose} className="rounded-lg">
                Cancel
              </Button>
              <Button 
                color="success" 
                onPress={handleSubmit}
                isDisabled={!isConnected || !modelUrl || isSubmitting}
                isLoading={isSubmitting}
                className="rounded-lg"
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