import { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { useAIChat } from '../hooks/useAIChat';

export default function AIChat() {
  const [activeTab, setActiveTab] = useState('chat');
  const tokenCredits = useTokenCredits();
  const aiChat = useAIChat(tokenCredits);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar / Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-xl font-semibold mb-6">TeeTee AI</h2>
        
        <Tabs 
          aria-label="Navigation" 
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          className="flex flex-col"
          variant="light"
        >
          <Tab key="chat" title="Chat">
            <div className="pt-4">
              <Button 
                color="default" 
                variant="light" 
                radius="sm" 
                className="w-full justify-start mb-2"
                onClick={aiChat.resetChat}
              >
                New Chat
              </Button>
            </div>
          </Tab>
          <Tab key="dashboard" title="Dashboard">
            <div className="pt-4">
              <p className="text-sm text-gray-600">
                Manage your credits and usage
              </p>
            </div>
          </Tab>
        </Tabs>
        
        {/* Token Balance */}
        {tokenCredits.isConnected && (
          <div className="mt-8 p-3 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-gray-800">Your Balance</p>
            <p className="text-xl font-bold">{tokenCredits.tokenBalance} Tokens</p>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex h-screen">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {!tokenCredits.isConnected ? (
                  <div className="h-full flex items-center justify-center">
                    <Card className="w-full max-w-md">
                      <CardBody className="text-center">
                        <p className="text-xl mb-4">Connect your wallet to chat with the AI</p>
                        <Button 
                          color="primary" 
                          size="lg"
                          onClick={tokenCredits.connectWallet}
                        >
                          Connect Wallet
                        </Button>
                      </CardBody>
                    </Card>
                  </div>
                ) : aiChat.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <h2 className="text-2xl font-semibold mb-2">Welcome to TeeTee AI</h2>
                      <p className="text-gray-600 mb-4">
                        This is a secure AI assistant running in a Trusted Execution Environment (TEE)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {aiChat.messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-3/4 p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="whitespace-pre-line">{message.content}</p>
                          <div className="mt-1 text-xs opacity-80 text-right">
                            {message.tokens} tokens
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pending message */}
                    {aiChat.isGenerating && (
                      <div className="flex justify-start">
                        <div className="max-w-3/4 p-3 rounded-lg bg-gray-100">
                          <div className="flex space-x-2 items-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-500"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Pending output signature */}
                    {aiChat.pendingOutputSignature && (
                      <div className="flex justify-center">
                        <Card className="w-full">
                          <CardHeader>
                            <p className="font-medium">Sign Transaction to View Response</p>
                          </CardHeader>
                          <CardBody>
                            <p className="text-sm mb-2">Preview:</p>
                            <div className="max-h-32 overflow-y-auto mb-3 p-2 bg-gray-50 rounded border text-sm">
                              {aiChat.mockResponse}
                            </div>
                            <p className="text-sm">Cost: {aiChat.pendingOutputCost} tokens</p>
                          </CardBody>
                          <CardFooter>
                            <Button 
                              color="primary" 
                              onClick={aiChat.signOutputTransaction}
                            >
                              Sign Transaction
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              {tokenCredits.isConnected && parseInt(tokenCredits.tokenBalance) > 0 && (
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <Input
                      className="flex-1"
                      type="text" 
                      value={aiChat.inputText}
                      onChange={aiChat.handleInputChange}
                      placeholder="Type your message here..." 
                      disabled={aiChat.isGenerating || aiChat.pendingOutputSignature}
                      size="lg"
                      radius="lg"
                    />
                    <Button
                      color="primary"
                      disabled={!aiChat.inputText.trim() || aiChat.isGenerating || aiChat.pendingOutputSignature}
                      onClick={aiChat.generateResponse}
                      radius="lg"
                      isIconOnly
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                      </svg>
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This will cost approximately {Math.ceil((aiChat.inputText?.length || 0) / 4)} tokens
                  </p>
                </div>
              )}
              
              {/* No tokens warning */}
              {tokenCredits.isConnected && parseInt(tokenCredits.tokenBalance) <= 0 && (
                <div className="p-4 border-t bg-yellow-50">
                  <div className="text-center">
                    <p className="font-medium text-yellow-800 mb-2">You have no tokens remaining</p>
                    <Button 
                      color="warning" 
                      variant="flat" 
                      onClick={() => setActiveTab('dashboard')}
                    >
                      Purchase Tokens
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            
            {!tokenCredits.isConnected ? (
              <Card className="w-full max-w-md mx-auto">
                <CardBody className="text-center">
                  <p className="text-xl mb-4">Connect your wallet to manage tokens</p>
                  <Button 
                    color="primary" 
                    size="lg"
                    onClick={tokenCredits.connectWallet}
                  >
                    Connect Wallet
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Credit Balance Card */}
                <Card shadow="sm" className="w-full">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Token Balance</h2>
                  </CardHeader>
                  <CardBody>
                    <p className="text-3xl font-bold mb-2">{tokenCredits.tokenBalance} Tokens</p>
                    <p className="text-sm text-gray-600">
                      These tokens can be used to interact with our AI services running in secure TEEs.
                    </p>
                  </CardBody>
                </Card>
                
                {/* Purchase Tokens Card */}
                <Card shadow="sm" className="w-full">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Purchase Tokens</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ETH Amount (min 0.002)
                        </label>
                        <Input
                          type="number"
                          min="0.002"
                          step="0.001"
                          value={tokenCredits.amount}
                          onChange={(e) => tokenCredits.setAmount(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Button
                        color="primary"
                        onClick={tokenCredits.handlePurchase}
                        disabled={tokenCredits.isPurchasing || !tokenCredits.amount}
                        className="w-full"
                      >
                        {tokenCredits.isPurchasing ? 'Processing...' : 'Purchase Tokens'}
                      </Button>
                      {tokenCredits.purchaseSuccess && (
                        <div className="mt-2 p-3 bg-green-100 text-green-800 rounded-md">
                          Transaction successful! Your tokens have been purchased.
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
                
                {/* Usage History */}
                <Card shadow="sm" className="w-full md:col-span-2">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Recent Usage</h2>
                  </CardHeader>
                  <CardBody>
                    {aiChat.tokenUsageHistory.length === 0 ? (
                      <p className="text-gray-500">No usage history yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {aiChat.tokenUsageHistory.map((entry, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.tokens}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{entry.text}</td>
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