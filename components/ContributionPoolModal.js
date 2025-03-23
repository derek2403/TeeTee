import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Spinner } from "@heroui/react";

export default function ContributionPoolModal({ isOpen, onClose, selectedNode, isConnected, address, modelUrl = '' }) {
  const [modalTab, setModalTab] = useState('instructions'); // 'instructions' or 'submit'
  const [localModelUrl, setLocalModelUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationState, setVerificationState] = useState('idle'); // 'idle', 'verifying', 'success', 'error'
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isFullScreenVerifying, setIsFullScreenVerifying] = useState(false);

  // Reset state when modal is opened with a new node
  useEffect(() => {
    if (isOpen && selectedNode) {
      setModalTab('instructions');
      // Always set to empty string regardless of prop value
      setLocalModelUrl('');
      setIsSubmitting(false);
      setVerificationState('idle');
      setVerificationMessage('');
      setIsFullScreenVerifying(false);
    }
  }, [isOpen, selectedNode]);

  // Reset state when modal is closed
  const handleClose = () => {
    setModalTab('instructions');
    setLocalModelUrl('');
    setIsSubmitting(false);
    setVerificationState('idle');
    setVerificationMessage('');
    setIsFullScreenVerifying(false);
    onClose();
  };

  const goToGitHub = () => {
    window.open('https://github.com/TEE-AI/setup-instructions', '_blank');
    // Don't close the modal, let the user decide
  };

  const verifyModelUrl = async (url) => {
    try {
      setVerificationState('verifying');
      setVerificationMessage('Verifying model URL...');

      // Use the Next.js API route instead of direct fetch
      const response = await fetch('/api/verify-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to verify model URL: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Verification response:', data);

      // Check if the hash matches the expected value
      const expectedHash = "194154b92fac8155deb2bad34ff2b34ccbcf06937d8de2d3cb7fef9aa7c79119";
      if (data && data.model_hash === expectedHash) {
        setVerificationState('success');
        setVerificationMessage('Model verification successful! Hash matches the expected value.');
        return true;
      } else {
        setVerificationState('error');
        setVerificationMessage(`Hash verification failed. Expected: ${expectedHash}, Got: ${data?.model_hash || 'undefined'}`);
        return false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState('error');
      setVerificationMessage(`Verification error: ${error.message}`);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !localModelUrl) return;

    setIsSubmitting(true);
    // Switch to full-screen verification mode
    setIsFullScreenVerifying(true);

    try {
      // Verify the model URL
      const isVerified = await verifyModelUrl(localModelUrl);

      if (isVerified) {
        // Show success message and close after a delay
        setTimeout(() => {
          alert(`Success! Node #${selectedNode.id} has been verified with the correct model hash.\n\nYour TEE node will now be added to the network.`);
          setIsSubmitting(false);
          setIsFullScreenVerifying(false);
          handleClose();
        }, 1000);
      } else {
        // Allow the user to see the error message
        setTimeout(() => {
          setIsSubmitting(false);
          setIsFullScreenVerifying(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setVerificationState('error');
      setVerificationMessage(`Network error: ${error.message}. Please try again.`);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsFullScreenVerifying(false);
      }, 1500);
    }
  };

  // Format wallet address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  // Helper to validate URL format
  const isValidUrl = (urlString) => {
    try {
      return urlString.trim().length > 0 && urlString.includes('://');
    } catch (e) {
      return false;
    }
  };

  // If in full-screen verification mode, show a simplified UI
  if (isFullScreenVerifying) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <ModalContent className="bg-white max-h-[90vh] flex flex-col">
          <div className="flex flex-col items-center justify-center h-80 p-8">
            {verificationState === 'verifying' && (
              <>
                <Spinner size="lg" className="mb-4" />
                <p className="text-lg text-center text-gray-700 font-semibold">Verifying Model...</p>
                <p className="text-sm text-center text-gray-500 mt-2">Checking URL: {localModelUrl}</p>
              </>
            )}
            {verificationState === 'success' && (
              <>
                <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-lg text-center text-green-700 font-semibold">Verification Successful</p>
                <p className="text-sm text-center text-green-600 mt-2">Model hash verified correctly!</p>
              </>
            )}
            {verificationState === 'error' && (
              <>
                <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <p className="text-lg text-center text-red-700 font-semibold">Verification Failed</p>
                <p className="text-sm text-center text-red-600 mt-2">{verificationMessage}</p>
              </>
            )}
          </div>
        </ModalContent>
      </Modal>
    );
  }

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
            <ModalBody className="overflow-y-auto min-h-[400px] max-h-[calc(90vh-180px)]">
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
            <ModalBody className="overflow-y-auto min-h-[400px] max-h-[calc(90vh-180px)]">
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
                    <div className="flex-shrink-0 flex flex-col items-start">
                      <span className="text-sm">0.99 ETH</span>
                      <div className="flex items-center mt-1">
                        <span className="text-sm font-bold">Base Sepolia</span>
                        <img
                          src="/Base.png"
                          alt="Base"
                          className="ml-1 w-4 h-4 rounded-full"
                        />
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
                  value={localModelUrl}
                  onChange={(e) => setLocalModelUrl(e.target.value)}
                  isDisabled={verificationState === 'verifying' || verificationState === 'success'}
                  isRequired
                  className="rounded-lg"
                />
              </div>

              {/* Verification Status */}
              {verificationState !== 'idle' && !isFullScreenVerifying && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${verificationState === 'verifying' ? 'bg-blue-50 text-blue-800' :
                    verificationState === 'success' ? 'bg-green-50 text-green-800' :
                      'bg-red-50 text-red-800'
                  }`}>
                  {verificationState === 'verifying' && (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      {verificationMessage}
                    </div>
                  )}
                  {verificationState === 'success' && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {verificationMessage}
                    </div>
                  )}
                  {verificationState === 'error' && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      {verificationMessage}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                <p>⚠️ Please ensure the Model URL is correct. We will verify that your node is running the correct model by checking its hash against our expected value.</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose} className="rounded-lg">
                Cancel
              </Button>
              <Button
                color="success"
                onPress={handleSubmit}
                isDisabled={!isConnected || !localModelUrl || localModelUrl.trim() === '' || isSubmitting || verificationState === 'verifying'}
                isLoading={isSubmitting && !isFullScreenVerifying}
                className="rounded-lg"
              >
                {isSubmitting && !isFullScreenVerifying ? "Verifying..." : "Submit Node Details"}
              </Button>
            </ModalFooter>
          </Tab>
        </Tabs>
      </ModalContent>
    </Modal>
  );
} 