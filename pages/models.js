import { useState, useEffect } from 'react';
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import InstructionsModal from '../components/InstructionsModal';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';
import useGetAllHostedLLMs from '../hooks/useGetAllHostedLLMs';

export default function Models() {

  const [modelMetadata, setModelMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  
  // Create Pool Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    description: '',
    modelUrl: '',
    icon: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Instructions Modal state
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
  // Contract address - adjust this to match your deployed contract
  const contractAddress = '0x396061f4eBa244416CA7020FA341F8F6A990D991';
  
  // Get blockchain data with the hook
  const { llmEntries, totalLLMs, fetchLLMEntries } = useGetAllHostedLLMs(contract);
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // Setup listeners for account changes
        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } else {
        console.log("No ethereum object found. Please install MetaMask.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };
  
  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setIsConnected(false);
      setAddress('');
    } else {
      // User switched account
      setAddress(accounts[0]);
    }
  };
  
  useEffect(() => {
    // Fetch model metadata from JSON file
    const fetchModelMetadata = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        // We only expect one model in the array, so take the first item
        setModelMetadata(data[0]);
      } catch (error) {
        console.error('Error fetching model metadata:', error);
      }
    };
    
    fetchModelMetadata();
    
    // Check if wallet already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
    
    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);
  
  // Fetch blockchain data when connected
  useEffect(() => {
    if (isConnected && contract) {
      fetchLLMEntries();
      setLoading(false);
    }
  }, [isConnected, contract]);
  
  // Combine blockchain data with metadata
  const combineModelData = () => {
    if (!llmEntries || llmEntries.length === 0 || !modelMetadata) {
      return [];
    }
    
    // Use the same metadata for all entries
    return llmEntries.map((llmEntry, index) => {
      // Filter valid addresses
      const validAddresses = [
        llmEntry.owner1 !== "0x0000000000000000000000000000000000000001" ? llmEntry.owner1 : null,
        llmEntry.owner2 !== "0x0000000000000000000000000000000000000001" ? llmEntry.owner2 : null
      ].filter(Boolean);
      
      // Use the URL directly from the blockchain data
      const nodeURL = llmEntry.url;
        
      return {
        id: index,
        name: modelMetadata.name,
        description: modelMetadata.description,
        owner1: llmEntry.owner1,
        owner2: llmEntry.owner2,
        url: llmEntry.url,
        modelUrl: `https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0`, // Default model URL
        nodeURL: nodeURL, // Use the URL from blockchain directly
        poolBalance: llmEntry.poolBalance,
        hostAddresses: validAddresses,
        numberOfNodes: 2 // Fixed at 2 since the contract has owner1 and owner2
      };
    });
  };
  
  const combinedModels = combineModelData();
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewModel(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreatePool = async () => {
    if (!newModel.modelUrl) {
      alert('Please fill in the model URL');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the smart contract's createHostedLLM function
      if (!contract) {
        throw new Error("Contract not initialized. Please connect your wallet.");
      }
      
      // Use the current address as owner1 and default address as owner2
      const tx = await contract.createHostedLLM(
        address, 
        "0x0000000000000000000000000000000000000001", // Default placeholder address for owner2
        newModel.modelUrl
      );
      
      await tx.wait();
      
      // Refresh the list
      await fetchLLMEntries();
      
      // Reset form and close modal
      setNewModel({
        name: '',
        description: '',
        modelUrl: '',
        icon: ''
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating model pool:', error);
      alert('Failed to create model pool: ' + error.message);
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

  // Helper function for safe BigNumber formatting
  const safeFormatEther = (value) => {
    if (!value) return "0";
    try {
      return ethers.formatEther(value);
    } catch (error) {
      console.error("Error formatting BigNumber:", error);
      return "0";
    }
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
            {combinedModels.map((model) => (
              <div key={model.id} onClick={() => handleModelClick(model)}>
                <Card 
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
                          {model.hostAddresses.length >= 2 ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                              <span className="text-xs text-yellow-600">Available for hosting</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                        
                        {/* Host information */}
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Hosted by {model.hostAddresses.length} node(s) of {model.numberOfNodes} required
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
      
      
      
      {/* Instructions Modal */}
      <InstructionsModal 
        isOpen={isInstructionsOpen} 
        onClose={() => setIsInstructionsOpen(false)} 
        model={selectedModel}
      />
    </div>
  );
} 