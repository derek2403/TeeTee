import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
import { useAIChat } from '../hooks/useAIChat';
import useCheckBalance from '../hooks/useCheckBalance';
import useGetAllHostedLLMs from '../hooks/useGetAllHostedLLMs';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';
import Dashboard from '../components/Dashboard';
import Token from '../components/Token';
import useUseTokens from '../hooks/useUseTokens';

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState(null); 
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  
  // Initialize contract for token functionality
  useEffect(() => {
    const initContract = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          setUserAddress(accounts[0]);
          
          const signer = await provider.getSigner();
          const contractAddress = '0x396061f4eBa244416CA7020FA341F8F6A990D991';
          const newContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(newContract);
          console.log("Contract initialized successfully in chat.js");
        } catch (error) {
          console.error("Failed to initialize contract in chat.js:", error);
        }
      }
    };
    
    initContract();
  }, []);
  
  // Use hooks for contract interaction
  const { tokenBalance, fetchTokenBalance } = useCheckBalance(contract);
  const { llmEntries, totalLLMs, fetchLLMEntries } = useGetAllHostedLLMs(contract);
  
  // Fetch LLM entries when contract is loaded
  useEffect(() => {
    if (contract) {
      fetchLLMEntries();
    }
  }, [contract]);
  
  // Set first LLM as default when entries are loaded
  useEffect(() => {
    if (llmEntries && llmEntries.length > 0 && selectedModel === 'ollama') {
      setSelectedModel(`llm-0`);
    }
  }, [llmEntries]);
  
  const aiChat = useAIChat({ tokenBalance, isConnected: !!contract });

  // Adding a style block to handle hiding scrollbars globally
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    // Add CSS to hide scrollbars while keeping scroll functionality
    style.textContent = `
      html, body {
        overflow: hidden;
        height: 100%;
        width: 100%;
      }
      /* Hide scrollbar for Chrome, Safari and Opera */
      ::-webkit-scrollbar {
        display: none;
      }
      /* Hide scrollbar for IE, Edge and Firefox */
      * {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
    `;
    // Append the style element to the head
    document.head.appendChild(style);

    // Clean up function
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle model change
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  // Toggle dashboard visibility
  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
    setShowTokens(false); // Close tokens if open
  };

  // Toggle tokens visibility
  const toggleTokens = () => {
    setShowTokens(!showTokens);
    setShowDashboard(false); // Close dashboard if open
  };

  // Helper function to check if an LLM is owned by the current user
  const isOwnedByUser = (llm) => {
    if (!userAddress) return false;
    
    return (
      userAddress.toLowerCase() === llm.owner1.toLowerCase() ||
      userAddress.toLowerCase() === llm.owner2.toLowerCase()
    );
  };

  // Helper function to format URL for display
  const formatUrlForDisplay = (url) => {
    if (!url) return '';
    
    // If it's a long URL, truncate it
    if (url.length > 30) {
      return url.substring(0, 27) + '...';
    }
    return url;
  };

  // Add the useUseTokens hook
  const { 
    isSpendingTokens, 
    resultMessage, 
    spendTokensData, 
    handleSpendTokensFormChange, 
    handleSpendTokens 
  } = useUseTokens(contract, userAddress, fetchTokenBalance);

  // Update the generateResponse function to handle token payments
  const generateResponse = async () => {
    if (!aiChat.inputText.trim()) return;
    if (!selectedModel) {
      // Alert the user to select a model
      alert("Please select a model before sending a message");
      return;
    }
    
    try {
      // Store the user input before adding to messages
      const userInput = aiChat.inputText;
      
      // Add user message to chat (without token cost)
      aiChat.addMessage("user", userInput);
      
      // Clear input using the hook's handleInputChange method
      const emptyEvent = { target: { value: "" } };
      aiChat.handleInputChange(emptyEvent);
      
      // Check if selected model is self-hosted
      const modelIndex = parseInt(selectedModel.split('-')[1]);
      const isModelSelfHosted = llmEntries[modelIndex] && isOwnedByUser(llmEntries[modelIndex]);
      
      // Call our proxy API route to get the AI response
      const responsePending = fetch("/api/tee-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userInput,
        }),
      });
      
      // Immediately fetch the Node1 RA report while waiting for the main response
      try {
        const node1RaResponse = await fetch("/api/ra-report");
        const node1RaData = await node1RaResponse.json();
        
        if (node1RaData.status === "success") {
          // Extract the Node1 quote
          const node1Quote = node1RaData.node1_attestation?.ra_report?.quote || "";
          console.log("Initial Node1 quote:", node1Quote ? node1Quote.substring(0, 30) + "..." : "none");
          
          // Add a message with the Node1 quote
          if (node1Quote) {
            aiChat.addMessage("node1-attestation", "Node1 Attestation Report", 0, {
              node1: node1Quote,
              node2: ""
            });
          }
        }
      } catch (error) {
        console.error("Error fetching Node1 RA report:", error);
      }
      
      // Wait for the main response to complete
      const response = await responsePending;
      const data = await response.json();
      
      // Extract the response from the output field
      const aiResponse = data.output;
      
      // For non-self-hosted models, calculate and charge tokens
      if (!isModelSelfHosted) {
        // Calculate tokens based on character count of input and output
        const totalCharacters = userInput.length + aiResponse.length;
        
        // Check if the user has enough tokens
        if (parseInt(tokenBalance) < totalCharacters) {
          aiChat.addMessage("system", 
            `Insufficient tokens: This response requires ${totalCharacters} tokens, but you only have ${tokenBalance}. 
             Please purchase more tokens to view the response.`, 0);
          return;
        }
        
        try {
          // Update spendTokensData with the correct token amount
          spendTokensData.tokenAmount = totalCharacters.toString();
          
          // Call the smart contract to spend tokens directly without confirmation
          const tx = await contract.useTokens(totalCharacters);
          await tx.wait();
          
          // Update token balance
          fetchTokenBalance();
          
          // Now that payment is confirmed, add the AI response
          aiChat.addMessage("assistant", aiResponse, totalCharacters);
        } catch (error) {
          console.error("Error spending tokens:", error);
          aiChat.addMessage("system", 
            `Error processing token payment: ${error.message}. 
             The response has been generated but cannot be displayed.`, 0);
          return;
        }
      } else {
        // For self-hosted models, add the response without charging tokens
        aiChat.addMessage("assistant", aiResponse, 0);
      }
      
      // Extract Node2 attestation directly from the tee-proxy response
      try {
        console.log("Checking for Node2 attestation in main response...");
        // Log just a small sample to avoid cluttering the console
        const dataSample = {...data};
        if (dataSample.attestation?.ra_report?.quote) {
          dataSample.attestation.ra_report.quote = dataSample.attestation.ra_report.quote.substring(0, 30) + "...";
        }
        console.log("Response structure sample:", JSON.stringify(dataSample, null, 2));
        
        // Find Node2 attestation in the response using various possible paths
        let node2Quote = null;
        
        if (data.attestation?.ra_report?.quote) {
          node2Quote = data.attestation.ra_report.quote;
          console.log("FOUND Node2 quote in data.attestation.ra_report.quote");
        } else if (data.ra_report?.quote) {
          node2Quote = data.ra_report.quote;
          console.log("FOUND Node2 quote in data.ra_report.quote");
        } else if (data.node2_attestation?.ra_report?.quote) {
          node2Quote = data.node2_attestation.ra_report.quote;
          console.log("FOUND Node2 quote in data.node2_attestation.ra_report.quote");
        } else {
          console.log("Available fields in response:", Object.keys(data));
          if (data.attestation) {
            console.log("Fields in data.attestation:", Object.keys(data.attestation));
            if (data.attestation.ra_report) {
              console.log("Fields in data.attestation.ra_report:", Object.keys(data.attestation.ra_report));
            }
          }
        }
        
        // Add Node2 attestation as a message if found
        if (node2Quote) {
          console.log("Adding Node2 attestation message with quote length:", node2Quote.length);
          // Force immediate update
          setTimeout(() => {
            aiChat.addMessage("node2-attestation", "Node2 Attestation", 0, {
              node1: "",
              node2: node2Quote
            });
            console.log("Node2 attestation message added to chat");
            console.log("Current message count:", aiChat.messages.length);
          }, 100);
        } else {
          console.log("No Node2 attestation found in the main response");
        }
      } catch (error) {
        console.error("Error extracting Node2 attestation from response:", error);
      }
      
    } catch (error) {
      console.error("Error generating response:", error);
    }
  };

  // Add this handler for the Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && aiChat.inputText.trim() && !aiChat.isGenerating) {
      if (!selectedModel) {
        alert("Please select a model before sending a message");
        return;
      }
      e.preventDefault();
      generateResponse();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 overflow-hidden">
      {/* Main Chat Container - Centered with 85% width and 80% height (reduced from 90%) */}
      <div className="relative w-[85%] h-[80%] mt-[-100] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Avatar, Token Display, and Model Selection */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            {/* Avatar that opens dashboard when clicked */}
            <div 
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer relative"
              onClick={toggleDashboard}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              
              {/* Dashboard Dropdown */}
              {showDashboard && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden border">
                  <div className="flex justify-center items-center p-3 border-b">
                    <h2 className="text-md font-bold text-black">Dashboard</h2>
                  </div>
                  <Dashboard 
                    tokenBalance={tokenBalance}
                    aiChat={aiChat}
                    onClose={toggleDashboard}
                    contract={contract}
                    llmEntries={llmEntries}
                    userAddress={userAddress}
                  />
                </div>
              )}
            </div>
            
            {/* Token Display - now with real token balance */}
            <div className="relative">
              <div 
                className="px-3 py-1 bg-blue-50 rounded-full text-sm font-medium cursor-pointer"
                onClick={toggleTokens}
              >
                Tokens: {tokenBalance || '0'}
              </div>
              
              {/* Token Dropdown */}
              {showTokens && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden border">
                  <div className="flex justify-center items-center p-3 border-b">
                    <h2 className="text-md font-bold text-black">Tokens</h2>
                  </div>
                  <Token 
                    tokenBalance={tokenBalance}
                    onClose={toggleTokens}
                    isDropdown={true}
                    contract={contract}
                    fetchTokenBalance={fetchTokenBalance}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Model Selector - Shows TinyLlama for all models and marks self-hosted */}
          <Select
            isRequired
            label="Select a model"
            className="max-w-xs"
            size="sm"
            value={selectedModel}
            onChange={handleModelChange}
          >
            {/* Display all LLM entries with TinyLlama name */}
            {llmEntries.map((llm, index) => (
              <SelectItem 
                key={`llm-${index}`} 
                value={`llm-${index}`}
                textValue={`TinyLlama-1.1B-Chat-v1.0 ${isOwnedByUser(llm) ? "(Self Hosted)" : ""} (#${index + 1})`}
              >
                <div className="flex flex-col">
                  <span>TinyLlama-1.1B-Chat-v1.0 {isOwnedByUser(llm) ? "(Self Hosted)" : ""} (#{index + 1})</span>
                  <span className="text-xs text-gray-500">{formatUrlForDisplay(llm.url)}</span>
                </div>
              </SelectItem>
            ))}
          </Select>
          
          {/* New Chat Button */}
          <Button
            color="default"
            variant="light"
            radius="full"
            onClick={aiChat.resetChat}
            size="sm"
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Chat
          </Button>
        </div>
        
        {/* Main Chat Content - REMOVED condition that was hiding content */}
        <>
          {/* Chat Messages - scrollable area */}
          <div className="flex-1 overflow-y-auto p-4">
            {aiChat.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold mb-3">Welcome to TeeTee</h2>
                  <p className="text-gray-600 text-sm">
                    This is a secure AI assistant running in a TEE
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiChat.messages.map((message, index) => {
                  console.log(`Rendering message ${index}:`, message.role, 
                              message.role === 'node2-attestation' ? 
                              `with quote length: ${message.attestationQuotes?.node2?.length || 0}` : '');
                  return (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' 
                          ? 'justify-end' 
                          : message.role === 'node1-attestation' || message.role === 'node2-attestation'
                            ? 'justify-center' 
                            : 'justify-start'
                      }`}
                    >
                      <div
                        className={`${
                          message.role === 'user'
                            ? 'max-w-[70%] bg-blue-600 text-white'
                            : message.role === 'node1-attestation' || message.role === 'node2-attestation'
                              ? 'max-w-[85%] bg-green-50 border border-green-200'
                              : 'max-w-[70%] bg-gray-100 text-gray-800'
                        } p-3 rounded-lg`}
                      >
                        {message.role === 'node1-attestation' ? (
                          <div className="text-xs">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-green-700 flex items-center">
                                <span>Node1 Attestation:</span>
                                <span className="font-mono ml-2 truncate max-w-[200px]">
                                  {message.attestationQuotes.node1.substring(0, 30)}...
                                </span>
                              </div>
                              <button 
                                onClick={() => {navigator.clipboard.writeText(message.attestationQuotes.node1)}}
                                className="p-1 hover:bg-gray-200 rounded ml-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : message.role === 'node2-attestation' ? (
                          <div className="text-xs">
                            <div className="flex flex-col gap-1">
                              <details className="cursor-pointer">
                                <summary className="font-medium flex items-center justify-between">
                                  <div className="flex items-center text-green-700">
                                    <span>Node2 Attestation</span>
                                    <span className="font-mono ml-2 truncate max-w-[200px]">
                                      {message.attestationQuotes.node2.substring(0, 30)}...
                                    </span>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault(); // Prevent details from toggling
                                      navigator.clipboard.writeText(message.attestationQuotes.node2);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded ml-2"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </summary>
                                <div className="p-2 mt-1 bg-gray-100 rounded overflow-x-auto">
                                  <p className="font-mono break-all select-all">{message.attestationQuotes.node2}</p>
                                </div>
                              </details>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-line text-sm break-words">{message.content}</p>
                            {message.tokens > 0 && (
                              <div className="mt-1 text-xs opacity-80 text-right">
                                {message.tokens} tokens
                              </div>
                            )}
                            {message.attestation && (
                              <div className="mt-2 text-xs text-gray-500">
                                <div className="flex flex-col gap-1">
                                  <details className="cursor-pointer">
                                    <summary className="font-medium">Attestation Node1</summary>
                                    <div className="p-2 mt-1 bg-gray-100 rounded overflow-x-auto">
                                      <p className="font-mono break-all select-all">{message.attestation.node1}</p>
                                    </div>
                                  </details>
                                  <details className="cursor-pointer">
                                    <summary className="font-medium">Attestation Node2</summary>
                                    <div className="p-2 mt-1 bg-gray-100 rounded overflow-x-auto">
                                      <p className="font-mono break-all select-all">{message.attestation.node2}</p>
                                    </div>
                                  </details>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pending message */}
                {aiChat.isGenerating && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 rounded-lg bg-gray-100">
                      <div className="flex space-x-2 items-center">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-500"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area - at the bottom */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                className="flex-1"
                type="text"
                value={aiChat.inputText}
                onChange={aiChat.handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                disabled={aiChat.isGenerating}
                size="md"
                radius="lg"
              />
              <Button
                color="primary"
                disabled={!aiChat.inputText.trim() || aiChat.isGenerating || !selectedModel}
                onClick={generateResponse}
                radius="lg"
                isIconOnly
                size="md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </Button>
            </div>
          </div>
        </>
      </div>
    </div>
  );
} 