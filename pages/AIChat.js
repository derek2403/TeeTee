import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/select";
import { useTokenCredits } from '../hooks/useTokenCredits';
import { useAIChat } from '../hooks/useAIChat';

export default function AIChat() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedModel, setSelectedModel] = useState('ollama'); 
  const tokenCredits = useTokenCredits();
  const aiChat = useAIChat(tokenCredits);

  // Whether to use tokens based on model selection
  const shouldUseTokens = selectedModel === 'ollama';

  // Auto-sign transactions when they're pending
  useEffect(() => {
    if (aiChat.pendingOutputSignature && aiChat.pendingOutputCost > 0 && shouldUseTokens) {
      aiChat.signOutputTransaction();
    }
  }, [aiChat.pendingOutputSignature, aiChat.pendingOutputCost, shouldUseTokens]);

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

  // Generate response with model awareness
  const generateModelAwareResponse = async () => {
    if (!aiChat.inputText.trim()) return;
    
    try {
      // Calculate tokens for the input (if using tokens)
      const inputTokenCost = shouldUseTokens ? Math.ceil(aiChat.inputText.length / 4) : 0;
      
      // Check if user has enough tokens (only when using token model)
      if (shouldUseTokens) {
        const availableTokens = parseInt(tokenCredits.tokenBalance);
        if (availableTokens < inputTokenCost) {
          alert(`Not enough tokens. Input requires ${inputTokenCost} tokens but you only have ${availableTokens}.`);
          return;
        }
        
        // Deduct tokens for input if needed
        if (inputTokenCost > 0) {
          const success = await tokenCredits.useTokens(inputTokenCost);
          if (!success) return;
        }
      }
      
      // Store the user input before adding to messages
      const userInput = aiChat.inputText;
      
      // Add user message to chat
      aiChat.addMessage("user", userInput, inputTokenCost);
      
      // Clear input using the hook's handleInputChange method
      // Set an empty value to clear the input
      const emptyEvent = { target: { value: "" } };
      aiChat.handleInputChange(emptyEvent);
      
      // Start generating - since we can't directly manipulate the isGenerating state
      // we'll simply proceed with the request
      
      // Call our proxy API route instead of the direct endpoint
      const response = await fetch("/api/tee-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userInput,
        }),
      });
      
      const data = await response.json();
      
      // Extract the response from the output field
      const aiResponse = data.output;
      
      // Extract attestation quotes for display (truncated)
      const attestationQuotes = {
        node1: data.attestation?.node1_attestation?.ra_report?.quote || "",
        node2: data.attestation?.ra_report?.quote || "",
      };
      
      // Calculate output tokens
      const outputTokenCost = shouldUseTokens ? Math.ceil(aiResponse.length / 4) : 0;
      
      // Deduct tokens for output if using tokens
      if (shouldUseTokens && outputTokenCost > 0) {
        const success = await tokenCredits.useTokens(outputTokenCost);
        if (!success) return;
      }
      
      // Add the response and quotes to the chat history
      aiChat.addMessage("assistant", aiResponse, outputTokenCost, attestationQuotes);
      
    } catch (error) {
      console.error("Error generating response:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar / Navigation - made more compact */}
      <div className="w-64 bg-white border-r border-gray-200 p-3 overflow-hidden">


        {/* Token Balance - moved up, right below the heading */}
        {tokenCredits.isConnected && (
          <div className="mb-3 p-2 bg-blue-50 rounded-md">
            <p className="text-xs font-medium text-gray-800">Your Balance</p>
            <p className="text-lg font-bold">{tokenCredits.tokenBalance} Tokens</p>
          </div>
        )}

        <Tabs
          aria-label="Navigation"
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          className="flex flex-col"
          variant="solid"
          color="primary"
        >
          <Tab key="chat" title="Chat">
            <div className="pt-2">
              <Button
                color="default"
                variant="light"
                radius="sm"
                className="w-full justify-start mb-1"
                onClick={aiChat.resetChat}
                size="sm"
              >
                New Chat
              </Button>
            </div>
          </Tab>
          <Tab key="dashboard" title="Dashboard">
            <div className="pt-2">
              <p className="text-xs text-gray-600">
                Manage your credits and usage
              </p>
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Main Content - Modified for fixed layout with no extra space */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Model Selector */}
            <div className="p-2">
              <Select
                isRequired
                label="Select a model"
                className="max-w-xs" // Set the width directly
                size="sm"
                value={selectedModel}
                onChange={handleModelChange}
              >
                <SelectItem key="self-hosted" value="self-hosted">Self hosted LLM shard (No Tokens Needed)</SelectItem>
                <SelectItem key="ollama" value="ollama">Ollama 3.2 (Tokens Needed)</SelectItem>
              </Select>
            </div>

            {/* Combined Area with fixed layout */}
            <div className="flex flex-col h-full overflow-hidden">
              {!tokenCredits.isConnected && shouldUseTokens ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardBody className="text-center">
                      <p className="text-lg mb-3">Connect your wallet to chat with the AI</p>
                      <Button
                        color="primary"
                        size="md"
                        onClick={tokenCredits.connectWallet}
                      >
                        Connect Wallet
                      </Button>
                    </CardBody>
                  </Card>
                </div>
              ) : (
                <>
                  {/* Chat Messages - with adjusted height calculation */}
                  <div
                    className="overflow-y-auto p-3"
                    style={{ height: "calc(100vh - 210px)" }} // Further adjusted for bottom margin
                  >
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
                      <div className="space-y-3">
                        {aiChat.messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-2 rounded-lg ${message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              <p className="whitespace-pre-line text-sm break-words">{message.content}</p>
                              {message.tokens && shouldUseTokens && (
                                <div className="mt-1 text-xs opacity-80 text-right">
                                  {message.tokens} tokens
                                </div>
                              )}
                              
                              {/* Display attestation quotes for assistant messages */}
                              {message.role === 'assistant' && message.attestationQuotes && (
                                <div className="mt-2 border-t pt-1 text-xs">
                                  {message.attestationQuotes.node1 && (
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="font-mono truncate w-56">{message.attestationQuotes.node1.substring(0, 40)}...</span>
                                      <button 
                                        onClick={() => {navigator.clipboard.writeText(message.attestationQuotes.node1)}}
                                        className="p-1 hover:bg-gray-200 rounded"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                  {message.attestationQuotes.node2 && (
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="font-mono truncate w-56">{message.attestationQuotes.node2.substring(0, 40)}...</span>
                                      <button 
                                        onClick={() => {navigator.clipboard.writeText(message.attestationQuotes.node2)}}
                                        className="p-1 hover:bg-gray-200 rounded"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Pending message */}
                        {aiChat.isGenerating && (
                          <div className="flex justify-start">
                            <div className="max-w-[70%] p-2 rounded-lg bg-gray-100">
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

                  {/* Input Area - reduced height and added bottom margin */}
                  <div className="p-2 border-t mb-4" style={{ height: "60px" }}>
                    {(parseInt(tokenCredits.tokenBalance) > 0 || !shouldUseTokens) ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          type="text"
                          value={aiChat.inputText}
                          onChange={aiChat.handleInputChange}
                          placeholder="Type your message here..."
                          disabled={aiChat.isGenerating || (aiChat.pendingOutputSignature && shouldUseTokens)}
                          size="sm"
                          radius="lg"
                        />
                        <Button
                          color="primary"
                          disabled={!aiChat.inputText.trim() || aiChat.isGenerating || (aiChat.pendingOutputSignature && shouldUseTokens)}
                          onClick={generateModelAwareResponse}
                          radius="lg"
                          isIconOnly
                          size="sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                          </svg>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-medium text-yellow-800 text-xs">You have no tokens remaining</p>
                        <Button
                          color="warning"
                          variant="flat"
                          size="sm"
                          onClick={() => setActiveTab('dashboard')}
                        >
                          Purchase Tokens
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Tab - more compact */}
        {activeTab === 'dashboard' && (
          <div className="p-3 overflow-y-auto h-full">
            <h1 className="text-xl font-bold mb-3">Dashboard</h1>

            {!tokenCredits.isConnected ? (
              <Card className="w-full max-w-md mx-auto">
                <CardBody className="text-center">
                  <p className="text-lg mb-3">Connect your wallet to manage tokens</p>
                  <Button
                    color="primary"
                    size="md"
                    onClick={tokenCredits.connectWallet}
                  >
                    Connect Wallet
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {/* Credit Balance Card */}
                <Card shadow="sm" className="w-full">
                  <CardHeader className="py-2">
                    <h2 className="text-lg font-semibold">Token Balance</h2>
                  </CardHeader>
                  <CardBody className="py-2">
                    <p className="text-2xl font-bold mb-1">{tokenCredits.tokenBalance} Tokens</p>
                    <p className="text-xs text-gray-600">
                      These tokens can be used to interact with our AI services running in secure TEEs.
                    </p>
                  </CardBody>
                </Card>

                {/* Purchase Tokens Card */}
                <Card shadow="sm" className="w-full">
                  <CardHeader className="py-2">
                    <h2 className="text-lg font-semibold">Purchase Tokens</h2>
                  </CardHeader>
                  <CardBody className="py-2">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          ETH Amount (min 0.002)
                        </label>
                        <Input
                          type="number"
                          min="0.002"
                          step="0.001"
                          value={tokenCredits.amount}
                          onChange={(e) => tokenCredits.setAmount(e.target.value)}
                          className="w-full"
                          size="sm"
                        />
                      </div>
                      <Button
                        color="primary"
                        onClick={tokenCredits.handlePurchase}
                        disabled={tokenCredits.isPurchasing || !tokenCredits.amount}
                        className="w-full"
                        size="sm"
                      >
                        {tokenCredits.isPurchasing ? 'Processing...' : 'Purchase Tokens'}
                      </Button>
                      {tokenCredits.purchaseSuccess && (
                        <div className="mt-1 p-2 bg-green-100 text-green-800 rounded-md text-xs">
                          Transaction successful! Your tokens have been purchased.
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Usage History */}
                <Card shadow="sm" className="w-full md:col-span-2">
                  <CardHeader className="py-2">
                    <h2 className="text-lg font-semibold">Recent Usage</h2>
                  </CardHeader>
                  <CardBody className="py-2">
                    {aiChat.tokenUsageHistory.length === 0 ? (
                      <p className="text-gray-500 text-sm">No usage history yet</p>
                    ) : (
                      <div className="overflow-x-auto max-h-40">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {aiChat.tokenUsageHistory.map((entry, index) => (
                              <tr key={index}>
                                <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">{entry.type}</td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">{entry.tokens}</td>
                                <td className="px-2 py-1 text-xs text-gray-500 truncate max-w-xs">{entry.text}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 