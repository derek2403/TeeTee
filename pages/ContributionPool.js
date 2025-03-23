import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';
import useGetAllHostedLLMs from '../hooks/useGetAllHostedLLMs';
import ContributionPoolModal from '../components/ContributionPoolModal';

export default function ContributionPool() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modelId, setModelId] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Contract address - adjust this to match your deployed contract
  const contractAddress = '0x396061f4eBa244416CA7020FA341F8F6A990D991';
  
  // Get blockchain data with the hook
  const { llmEntries, totalLLMs, fetchLLMEntries } = useGetAllHostedLLMs(contract);
  
  // Get model ID from URL query parameter
  useEffect(() => {
    if (router.query.model) {
      setModelId(parseInt(router.query.model));
    }
  }, [router.query]);
  
  // Connect to contract
  useEffect(() => {
    const connectToContract = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(contractAddress, contractABI, provider);
          setContract(contract);
        } catch (error) {
          console.error("Error connecting to contract:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    connectToContract();
  }, []);
  
  // Fetch LLM entries when contract is ready
  useEffect(() => {
    if (contract) {
      fetchLLMEntries();
    }
  }, [contract, fetchLLMEntries]);
  
  // Find the LLM entry based on model ID
  const selectedLLM = llmEntries && modelId !== null ? 
    llmEntries[modelId] : null;
  
  // Create an array of nodes with owner information
  const teeNodes = [
    { id: 1, status: selectedLLM ? 'occupied' : 'empty', address: '', model: 'TinyLlama-1.1B-Chat-v1.0' },
    { id: 2, status: selectedLLM ? 'occupied' : 'empty', address: '', model: 'TinyLlama-1.1B-Chat-v1.0' },
  ];
  
  // Set owner information if we have a selected LLM
  if (selectedLLM) {
    // Get non-default owners
    const validOwners = [
      selectedLLM.owner1 !== "0x0000000000000000000000000000000000000001" ? selectedLLM.owner1 : null,
      selectedLLM.owner2 !== "0x0000000000000000000000000000000000000001" ? selectedLLM.owner2 : null
    ].filter(Boolean);
    
    // Assign owners to nodes
    if (validOwners.length > 0) {
      teeNodes[1].address = validOwners[0]; // Always show first valid owner on node 2
    }
  }
  
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
      <div className="max-w-6xl mx-auto my-8">
        <h1 className="text-3xl font-bold mb-6">Contribution Pool</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading model information...</p>
          </div>
        ) : (
          <>
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
                isDisabled
                label="Select a model to contribute"
                placeholder="Choose LLM model" 
                aria-label="Select a model to contribute"
                className="max-w-md"
                classNames={{
                  trigger: "border-blue-500 rounded-lg h-12",
                  label: "text-sm text-gray-700",
                  base: "max-w-md",
                  value: "text-sm font-medium",
                }}
                defaultSelectedKeys={["tinyllama"]}
                renderValue={(items) => {
                  return items.map(item => (
                    <div key={item.key} className="text-sm">
                      {item.props.children}
                    </div>
                  ));
                }}
              >
                <SelectItem key="tinyllama">TinyLlama-1.1B-Chat-v1.0 (2 TEE Nodes)</SelectItem>
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
                        
                        {node.status === 'occupied' && node.address ? (
                          <div className="mt-auto">
                            <div className="bg-blue-50 p-2 rounded-md">
                              <p className="text-xs text-gray-700">Hosted by</p>
                              <p className="font-mono text-sm">{formatAddress(node.address)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-auto">
                            <Button 
                              color="primary" 
                              onClick={() => openHostModal(node)}
                              className="w-full"
                              disabled={!modelId}
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
          </>
        )}
      </div>
      
      {/* Hosting Modal as a separate component */}
      <ContributionPoolModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        selectedNode={selectedNode}
        isConnected={isConnected}
        address={address}
        modelUrl={selectedLLM?.url || ""}
      />
    </div>
  );
} 