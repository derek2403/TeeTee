import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
import { useAIChat } from '../hooks/useAIChat';
import { useCheckBalance } from '../hooks';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';
import Dashboard from '../components/Dashboard';
import Token from '../components/Token';

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState('ollama'); 
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [contract, setContract] = useState(null);
  
  // Initialize contract for token functionality
  useEffect(() => {
    const initContract = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractAddress = '0x4785815a0CBA353484D566029471Fa2E4C596a3a';
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
  
  // Use the hook to get real token balance
  const { tokenBalance, fetchTokenBalance } = useCheckBalance(contract);
  
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

  // Generate response without token functionality
  const generateResponse = async () => {
    if (!aiChat.inputText.trim()) return;
    
    try {
      // Store the user input before adding to messages
      const userInput = aiChat.inputText;
      
      // Add user message to chat (without token cost)
      aiChat.addMessage("user", userInput);
      
      // Clear input using the hook's handleInputChange method
      const emptyEvent = { target: { value: "" } };
      aiChat.handleInputChange(emptyEvent);
      
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
      
      // Add the response WITHOUT attestation quotes
      aiChat.addMessage("assistant", aiResponse, 0);
      
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
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer"
              onClick={toggleDashboard}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
                  <div className="flex justify-between items-center p-3 border-b">
                    <h2 className="text-md font-bold">Tokens</h2>
                    <Button
                      color="default"
                      variant="light"
                      onClick={toggleTokens}
                      size="sm"
                      isIconOnly
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
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
          
          {/* Model Selector */}
          <Select
            isRequired
            label="Select a model"
            className="max-w-xs"
            size="sm"
            value={selectedModel}
            onChange={handleModelChange}
          >
            <SelectItem key="self-hosted" value="self-hosted">Self hosted LLM shard</SelectItem>
            <SelectItem key="ollama" value="ollama">Ollama 3.2</SelectItem>
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
        
        {/* Conditional Dashboard Overlay - when clicking avatar */}
        {showDashboard && (
          <div className="absolute inset-0 bg-white z-10 overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Dashboard</h2>
              <Button
                color="default"
                variant="light"
                onClick={toggleDashboard}
                size="sm"
              >
                Close
              </Button>
            </div>
            <Dashboard 
              tokenBalance={tokenBalance}
              aiChat={aiChat}
              onClose={toggleDashboard}
            />
          </div>
        )}
        
        {/* Main Chat Content - hide only when dashboard is showing */}
        {!showDashboard && (
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
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-green-700 flex items-center">
                                  <span>Node2 Attestation:</span>
                                  <span className="font-mono ml-2 truncate max-w-[200px]">
                                    {message.attestationQuotes.node2.substring(0, 30)}...
                                  </span>
                                </div>
                                <button 
                                  onClick={() => {navigator.clipboard.writeText(message.attestationQuotes.node2)}}
                                  className="p-1 hover:bg-gray-200 rounded ml-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
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
                  disabled={!aiChat.inputText.trim() || aiChat.isGenerating}
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
        )}
      </div>
    </div>
  );
} 