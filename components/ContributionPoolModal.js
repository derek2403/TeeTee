import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Spinner } from "@heroui/react";
import { useRouter } from 'next/router';
import useEditHostedLLM from '../hooks/useEditHostedLLM';
import useGetAllHostedLLMs from '../hooks/useGetAllHostedLLMs';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';

// Contract address
const CONTRACT_ADDRESS = "0x396061f4eBa244416CA7020FA341F8F6A990D991";

export default function ContributionPoolModal({ isOpen, onClose, selectedNode, isConnected, address, modelUrl = '', contract: contractProp }) {
  const [modalTab, setModalTab] = useState('instructions'); // 'instructions' or 'submit'
  const [localModelUrl, setLocalModelUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationState, setVerificationState] = useState('idle'); // 'idle', 'verifying', 'success', 'error'
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isFullScreenVerifying, setIsFullScreenVerifying] = useState(false);
  const [registrationState, setRegistrationState] = useState('idle'); // 'idle', 'registering', 'success', 'error'
  const [contract, setContract] = useState(contractProp);
  const [signer, setSigner] = useState(null);
  
  // Get model ID from URL or use a default fallback from selectedNode
  const router = useRouter();
  const modelId = router.query.model ? parseInt(router.query.model) : 
                  (selectedNode && selectedNode.id ? parseInt(selectedNode.id) : 1);
  
  // Initialize contract if not provided
  useEffect(() => {
    const initializeContract = async () => {
      try {
        if (!contract && window.ethereum && isConnected) {
          console.log("Initializing contract directly");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const ethSigner = await provider.getSigner();
          setSigner(ethSigner);
          const newContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, ethSigner);
          setContract(newContract);
          console.log("Contract initialized successfully");
        }
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    };
    
    initializeContract();
  }, [isConnected, contract]);
  
  // Import necessary hooks for LLM management
  const { fetchLLMEntries, llmEntries } = useGetAllHostedLLMs(contract);
  const { handleEditLLM, isEditingLLM, resultMessage, editLLMData, handleEditLLMFormChange } = 
    useEditHostedLLM(contract, address, fetchLLMEntries);

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
      setRegistrationState('idle');
    }
  }, [isOpen, selectedNode]);

  // Load LLM data when the modal is opened
  useEffect(() => {
    if (isOpen && contract && modelId !== null) {
      fetchLLMEntries();
    }
  }, [isOpen, contract, modelId, fetchLLMEntries]);

  // Reset state when modal is closed
  const handleClose = () => {
    setModalTab('instructions');
    setLocalModelUrl('');
    setIsSubmitting(false);
    setVerificationState('idle');
    setVerificationMessage('');
    setIsFullScreenVerifying(false);
    setRegistrationState('idle');
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
        // Instead of throwing an error, just handle it with a user-friendly message
        setVerificationState('error');
        setVerificationMessage(`Unable to verify model. Please check your URL and try again.`);
        console.error(`Failed to verify model URL: ${response.statusText}`, errorData);
        return false;
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
        setVerificationMessage(`Hash verification failed. Please check your model URL and try again.`);
        console.log(`Expected: ${expectedHash}, Got: ${data?.model_hash || 'undefined'}`);
        return false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState('error');
      // Provide a user-friendly message instead of showing the actual error
      setVerificationMessage(`Unable to verify the model. Please check your internet connection and try again.`);
      return false;
    }
  };

  // Add a function to register the node with smart contract
  const registerNode = async () => {
    try {
      setRegistrationState('registering');
      
      // Check if contract is available
      if (!contract) {
        console.error("Contract is not initialized");
        throw new Error("Smart contract is not initialized. Please try again.");
      }
      
      // Check if the contract has a signer (can write)
      try {
        const signer = contract.runner;
        if (!signer) {
          console.error("Contract doesn't have a signer");
          throw new Error("Contract is not connected to a wallet. Please reconnect your wallet.");
        }
        console.log("Contract has a valid signer", signer);
      } catch (error) {
        console.error("Error checking signer:", error);
        throw new Error("Contract signer error: " + error.message);
      }
      
      if (modelId === undefined || modelId === null) {
        throw new Error(`Model ID is not available. Current value: ${modelId}`);
      }
      
      console.log(`Registering node with Model ID: ${modelId}, URL: ${localModelUrl}`);
      
      // Default registration address as fallback
      const registrationAddress = "0x0000000000000000000000000000000000000001";
      
      // Get the original owner1 value from llmEntries if available
      let owner1 = registrationAddress;
      // Check if we have entries and the modelId exists
      if (llmEntries && llmEntries.length > modelId && llmEntries[modelId]) {
        owner1 = llmEntries[modelId].owner1;
        console.log(`Maintaining original owner1 from model #${modelId}:`, owner1);
      } else {
        console.log(`No existing model data found for ID ${modelId}, using default registration address`);
      }
      
      // Set owner2 to the connected wallet
      let owner2 = address;
      
      // Ensure owner2 is valid
      if (!owner2 || owner2 === ethers.ZeroAddress) {
        throw new Error("Connected wallet address is not available");
      }
      
      console.log("Using addresses:", {
        owner1,
        owner2,
        modelId: modelId.toString(),
        url: localModelUrl
      });
      
      // Prepare data for the transaction
      const llmData = {
        llmId: modelId.toString(),
        owner1: owner1,
        owner2: owner2,
        url: localModelUrl
      };
      
      console.log("Preparing transaction with data:", llmData);
      
      // Update editLLMData for the hook
      Object.keys(llmData).forEach(key => {
        handleEditLLMFormChange({
          target: { name: key, value: llmData[key] }
        });
      });
      
      console.log("About to call contract function...");
      
      // Execute the transaction directly rather than via the hook
      try {
        // First try direct contract call
        const tx = await contract.editHostedLLM(
          modelId,
          owner1,
          owner2,
          localModelUrl
        );
        
        console.log("Transaction submitted:", tx);
        setVerificationMessage("Transaction submitted! Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        setRegistrationState('success');
        return true;
      } catch (directError) {
        console.error("Direct contract call failed:", directError);
        
        // Fall back to hook method
        console.log("Trying via hook method...");
        await handleEditLLM();
        
        setRegistrationState('success');
        return true;
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegistrationState('error');
      setVerificationMessage(`Registration error: ${error.message}`);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !localModelUrl) return;

    setIsSubmitting(true);
    // Switch to full-screen verification mode
    setIsFullScreenVerifying(true);

    try {
      // Log validation information
      console.log(`Starting verification with Model ID: ${modelId}, URL: ${localModelUrl}`);
      
      // Verify the model URL
      const isVerified = await verifyModelUrl(localModelUrl);

      if (isVerified) {
        // Show transaction signing message
        setVerificationMessage('Verification successful! Please sign the transaction in your wallet to register your node.');
        
        // Allow a brief pause to show the success message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Update UI state to show we're waiting for transaction
          setVerificationState('success');
          setRegistrationState('registering');
          
          // Display specific wallet prompt message
          setVerificationMessage('Please check your wallet and approve the transaction...');
          
          // Proceed with node registration
          console.log("Calling registerNode() function to initiate wallet transaction");
          const isRegistered = await registerNode();
          
          if (isRegistered) {
            // Show success message briefly, then redirect
            setRegistrationState('success');
            setVerificationMessage('Transaction confirmed! Redirecting to models page...');
            setTimeout(() => {
              // Close modal
              handleClose();
              // Redirect to models page
              window.location.href = 'http://localhost:3000/models';
            }, 2000);
          }
          // If not registered, the error state is already set in registerNode function
        } catch (registrationError) {
          console.error("Registration error:", registrationError);
          setRegistrationState('error');
          setVerificationMessage(`Registration error: Please try again.`);
          // Keep the full screen open so the user can see the error
          setIsSubmitting(false);
        }
      } else {
        // Just stop the spinner and keep showing the error
        setIsSubmitting(false);
        // Show the error in the regular form, not in the full screen
        setIsFullScreenVerifying(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setVerificationState('error');
      setVerificationMessage(`Unable to verify model. Please check your URL and try again.`);
      setIsSubmitting(false);
      // Show the error in the regular form, not in the full screen
      setIsFullScreenVerifying(false);
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
            {verificationState === 'success' && registrationState === 'idle' && (
              <>
                <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-lg text-center text-green-700 font-semibold">Verification Successful</p>
                <p className="text-sm text-center text-green-600 mt-2">Model hash verified correctly!</p>
                <p className="text-sm text-center text-blue-600 mt-4">Preparing transaction...</p>
              </>
            )}
            {registrationState === 'registering' && (
              <>
                <div className="flex flex-col items-center">
                
                  <Spinner size="lg" className="mb-2" />
                </div>
                <p className="text-lg text-center text-gray-700 font-semibold">Waiting for Transaction Approval</p>
                <p className="text-sm text-center text-gray-500 mt-1">Please check your wallet and confirm the transaction</p>
                <div className="text-sm text-center text-gray-500 mt-1">
                  <p className="mb-1">Model ID: {modelId}</p>
                  <p className="break-all max-w-[300px] mx-auto">URL: {localModelUrl}</p>
                </div>
              </>
            )}
            {registrationState === 'success' && (
              <>
                <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-lg text-center text-green-700 font-semibold">Registration Successful</p>
                <p className="text-sm text-center text-green-600 mt-2">Your node has been registered to the network!</p>
                <p className="text-sm text-center text-blue-600 mt-2">Redirecting to models page...</p>
              </>
            )}
            {registrationState === 'error' && (
              <>
                <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <p className="text-lg text-center text-red-700 font-semibold">Registration Failed</p>
                <p className="text-sm text-center text-red-600 mt-2">{verificationMessage || resultMessage || "Transaction failed. Please try again."}</p>
                <div className="mt-6 flex space-x-4">
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={() => {
                      setIsSubmitting(false);
                      setIsFullScreenVerifying(false);
                      setRegistrationState('idle');
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="primary"
                    onPress={() => {
                      setRegistrationState('idle');
                      registerNode();
                    }}
                    className="rounded-lg"
                  >
                    Try Again
                  </Button>
                </div>
              </>
            )}
            {verificationState === 'error' && (
              <>
                <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <p className="text-lg text-center text-red-700 font-semibold">Verification Failed</p>
                <p className="text-sm text-center text-red-600 mt-2">{verificationMessage}</p>
                <Button 
                  color="primary"
                  onPress={() => {
                    setIsSubmitting(false);
                    setIsFullScreenVerifying(false);
                    setVerificationState('idle');
                  }}
                  className="mt-6 rounded-lg"
                >
                  Try Again
                </Button>
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
              <div className="mb-3">
                <h3 className="text-sm font-medium mb-1">Wallet Details</h3>

                {isConnected ? (
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg border border-gray-200 cursor-not-allowed">
                    <div className="flex-grow">
                      <p className="text-sm">Connected Wallet</p>
                      <p className="font-mono text-sm text-gray-700">{formatAddress(address)}</p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-start">
                      <span className="text-sm">0.99 ETH</span>
                      <div className="flex items-center mt-0.5">
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
                  <div className="bg-yellow-50 p-2 rounded-lg mb-2">
                    <p className="text-sm text-yellow-800 mb-1">
                      You need to connect your wallet to host a TEE node.
                    </p>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </div>
                )}
              </div>

              {/* Simplified Form - Only Model URL */}
              <div className="space-y-3">
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

              {/* Warning Message */}
              <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                <p>⚠️ Please ensure the Model URL is correct. We will verify that your node is running the correct model by checking its hash against our expected value.</p>
              </div>

              {/* Verification Status */}
              {verificationState !== 'idle' && !isFullScreenVerifying && (
                <div className={`mt-2 p-2 rounded-lg text-sm ${verificationState === 'verifying' ? 'bg-blue-50 text-blue-800' :
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