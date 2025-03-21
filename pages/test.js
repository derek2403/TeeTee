import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';

export default function TestPage() {
  const [amount, setAmount] = useState('0.002');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [withdrawAmount, setWithdrawAmount] = useState('0.001');
  const [tokenUseAmount, setTokenUseAmount] = useState('10');
  const [userAddress, setUserAddress] = useState('');
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [poolBalance, setPoolBalance] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isUsingTokens, setIsUsingTokens] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [useTokensSuccess, setUseTokensSuccess] = useState(false);
  
  // LLM Simulation States
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [simulationTokens, setSimulationTokens] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAvailableTokens, setHasAvailableTokens] = useState(true);
  const [tokenUsageHistory, setTokenUsageHistory] = useState([]);
  const [pendingOutputSignature, setPendingOutputSignature] = useState(false);
  const [pendingOutputCost, setPendingOutputCost] = useState(0);
  const [mockResponse, setMockResponse] = useState('');
  const [isSigningOutput, setIsSigningOutput] = useState(false);
  
  const contractAddress = '0x2ABf94cB5B0cA6e00f85F77Cc88a17204f511BE7';
  
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
        
        // Check if connected user is owner
        const ownerAddress = await contract.owner();
        setIsOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        
        // Initial data fetching
        fetchTokenBalance(accounts[0], contract);
        fetchPoolBalance(contract);
        
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
      setIsOwner(false);
    } else {
      // User switched account
      setAddress(accounts[0]);
      if (contract) {
        const ownerAddress = await contract.owner();
        setIsOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        fetchTokenBalance(accounts[0], contract);
      }
    }
  };
  
  // Fetch token balance
  const fetchTokenBalance = async (userAddress, contractInstance) => {
    try {
      if (!contractInstance) return;
      
      // Try using checkBalance first
      try {
        const balance = await contractInstance.checkBalance();
        setTokenBalance(balance.toString());
        // Check if user has available tokens for simulation
        setHasAvailableTokens(parseInt(balance.toString()) > 0);
        setSimulationTokens(parseInt(balance.toString()));
      } catch (error) {
        // Fallback to mapping
        const balance = await contractInstance.tokenBalances(userAddress);
        setTokenBalance(balance.toString());
        // Check if user has available tokens for simulation
        setHasAvailableTokens(parseInt(balance.toString()) > 0);
        setSimulationTokens(parseInt(balance.toString()));
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  // Fetch pool balance
  const fetchPoolBalance = async (contractInstance) => {
    try {
      if (!contractInstance) return;
      
      const balance = await contractInstance.totalPoolBalance();
      setPoolBalance(balance);
    } catch (error) {
      console.error("Error fetching pool balance:", error);
    }
  };
  
  // Purchase tokens
  const handlePurchase = async () => {
    try {
      if (!contract) return;
      
      setIsPurchasing(true);
      setPurchaseSuccess(false);
      
      const weiAmount = ethers.parseEther(amount);
      const tx = await contract.purchaseTokens(weiAmount, {
        value: weiAmount
      });
      
      await tx.wait();
      
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      
      // Refresh data
      fetchTokenBalance(address, contract);
      fetchPoolBalance(contract);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setPurchaseSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error("Purchase error:", error);
      setIsPurchasing(false);
    }
  };
  
  // Withdraw funds (owner only)
  const handleWithdraw = async () => {
    try {
      if (!contract || !isOwner) return;
      
      setIsWithdrawing(true);
      setWithdrawSuccess(false);
      
      const weiAmount = ethers.parseEther(withdrawAmount);
      const tx = await contract.withdrawPool(weiAmount);
      
      await tx.wait();
      
      setIsWithdrawing(false);
      setWithdrawSuccess(true);
      
      // Refresh data
      fetchPoolBalance(contract);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setWithdrawSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error("Withdraw error:", error);
      setIsWithdrawing(false);
    }
  };
  
  // Use tokens (owner only)
  const handleUseTokens = async () => {
    try {
      if (!contract || !isOwner) return;
      
      setIsUsingTokens(true);
      setUseTokensSuccess(false);
      
      const tx = await contract.useTokens(userAddress, tokenUseAmount);
      
      await tx.wait();
      
      setIsUsingTokens(false);
      setUseTokensSuccess(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setUseTokensSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error("Use tokens error:", error);
      setIsUsingTokens(false);
    }
  };
  
  // LLM Simulation - Handle input change
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  
  // LLM Simulation - Generate response and sign input transaction
  const generateResponse = async () => {
    if (!inputText.trim() || !hasAvailableTokens) return;
    
    const inputTokenCost = inputText.length; // Simplified: 1 character = 1 token
    
    // Check if user has enough tokens
    if (simulationTokens < inputTokenCost) {
      alert(`Not enough tokens. Input requires ${inputTokenCost} tokens but you only have ${simulationTokens}.`);
      return;
    }
    
    // Start generating - this immediately signs the input transaction
    setIsGenerating(true);
    
    // Deduct input tokens immediately (as if transaction was signed)
    const remainingTokens = simulationTokens - inputTokenCost;
    setSimulationTokens(remainingTokens);
    
    // Add to usage history
    setTokenUsageHistory(prev => [...prev, {
      type: 'Input (signed)',
      text: inputText,
      tokens: inputTokenCost,
      remaining: remainingTokens
    }]);
    
    // Simulate transaction for input tokens
    if (contract && address) {
      try {
        await handleSimulatedTokenUsage(inputTokenCost);
      } catch (error) {
        console.error("Error handling input token usage:", error);
        setIsGenerating(false);
        return;
      }
    }
    
    const savedInput = inputText; // Save input before clearing
    setInputText(''); // Clear input for next interaction
    
    // Generate mock response with setTimeout to simulate delay
    setTimeout(() => {
      // Simple mock response that's roughly 2x the length of input
      const response = `This is a simulation of an LLM response to: "${savedInput}". 
      
In a real LLM integration, this would be where the actual API response appears. For this simulation, we're just generating dummy text that's approximately twice the length of your input to demonstrate how token usage works.

The important concept here is that both your input and the generated output consume tokens from your balance. In a production system, the token calculation would be more sophisticated than just counting characters.`;
      
      const outputTokenCost = response.length; // Simplified: 1 character = 1 token
      
      // Check if user has enough tokens for output
      if (remainingTokens < outputTokenCost) {
        // Not enough tokens for full response - need to truncate
        const truncatedResponse = response.substring(0, remainingTokens);
        setMockResponse(truncatedResponse + "... [Response truncated due to insufficient tokens]");
        setPendingOutputCost(remainingTokens); // Charge only what's available
      } else {
        // Enough tokens for full response
        setMockResponse(response);
        setPendingOutputCost(outputTokenCost);
      }
      
      setIsGenerating(false);
      setPendingOutputSignature(true);
    }, 1500); // 1.5 second delay to simulate processing
  };
  
  // LLM Simulation - Sign the output transaction
  const signOutputTransaction = async () => {
    if (!pendingOutputSignature || pendingOutputCost <= 0) return;
    
    setIsSigningOutput(true);
    
    // Deduct output tokens upon signature
    const finalTokens = simulationTokens - pendingOutputCost;
    setSimulationTokens(finalTokens);
    setHasAvailableTokens(finalTokens > 0);
    
    // Add to usage history
    setTokenUsageHistory(prev => [...prev, {
      type: 'Output (signed)',
      text: mockResponse,
      tokens: pendingOutputCost,
      remaining: finalTokens
    }]);
    
    // Simulate transaction for output tokens
    if (contract && address) {
      try {
        await handleSimulatedTokenUsage(pendingOutputCost);
      } catch (error) {
        console.error("Error handling output token usage:", error);
      }
    }
    
    // Show the output
    setOutputText(mockResponse);
    
    // Reset pending states
    setPendingOutputSignature(false);
    setIsSigningOutput(false);
    setPendingOutputCost(0);
  };
  
  // LLM Simulation - Deduct tokens from contract
  const handleSimulatedTokenUsage = async (tokenAmount) => {
    try {
      if (isOwner && contract) {
        // If the connected user is the owner, execute the useTokens function
        // This is simplified - in a real application you'd likely have a backend service do this
        const tx = await contract.useTokens(address, tokenAmount);
        await tx.wait();
        
        // Update token balance
        fetchTokenBalance(address, contract);
      } else {
        // In a real app, this would be an API call to your backend
        console.log(`Simulation: ${tokenAmount} tokens used from user ${address}`);
        // For the demo, we manually update the display values
        const newBalance = Math.max(0, parseInt(tokenBalance) - tokenAmount);
        setTokenBalance(newBalance.toString());
      }
    } catch (error) {
      console.error("Error handling simulated token usage:", error);
    }
  };
  
  // Reset the simulation
  const resetSimulation = () => {
    setOutputText('');
    setInputText('');
    setTokenUsageHistory([]);
    setIsSigningOutput(false);
    setPendingOutputSignature(false);
    setPendingOutputCost(0);
    setMockResponse('');
    // Refresh token balance to sync with actual contract state
    if (contract && address) {
      fetchTokenBalance(address, contract);
    }
  };
  
  // Init effect - check if wallet already connected
  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Test Smart Contract</h1>
        
        {!isConnected ? (
          <div className="p-8 text-center">
            <p className="text-xl mb-4">Please connect your wallet to interact with the contract</p>
            <button 
              onClick={connectWallet}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Your Token Balance</h2>
              <p className="text-2xl font-bold">{tokenBalance} Tokens</p>
            </div>
            
            {/* LLM Simulation Section */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">LLM Token Usage Simulation</h2>
              <p className="mb-4 text-sm text-gray-600">
                This simulates how tokens would be used in an LLM interaction. 
                For simplicity, 1 character = 1 token. Both input and output consume tokens.
              </p>
              
              <div className="p-3 bg-gray-100 rounded-md mb-4">
                <p className="font-medium mb-2">Simulation Token Balance: {simulationTokens}</p>
                {tokenUsageHistory.length > 0 && (
                  <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    <p className="font-medium">Usage History:</p>
                    {tokenUsageHistory.map((entry, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{entry.type}: {entry.tokens} tokens</span>
                        <span>Remaining: {entry.remaining}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Input (each character counts as 1 token)
                  </label>
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type your input here..."
                    disabled={!hasAvailableTokens || isGenerating || pendingOutputSignature || isSigningOutput}
                    className="w-full p-2 border rounded-md h-24"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    This input will cost approximately {inputText.length} tokens (signs automatically on submission)
                  </p>
                </div>
                
                <div className="flex justify-between">
                  {!pendingOutputSignature ? (
                    <button
                      onClick={generateResponse}
                      disabled={!inputText.trim() || !hasAvailableTokens || isGenerating || isSigningOutput}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {isGenerating ? 'Signing & Processing...' : 'Submit Query'}
                    </button>
                  ) : (
                    <button
                      onClick={signOutputTransaction}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 animate-pulse"
                    >
                      Sign Transaction for Output ({pendingOutputCost} tokens)
                    </button>
                  )}
                  
                  <button
                    onClick={resetSimulation}
                    className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Reset Simulation
                  </button>
                </div>
                
                {/* Transaction signing information */}
                {isGenerating && (
                  <div className="p-3 bg-blue-100 text-blue-800 rounded-md">
                    <p className="font-medium">Generating Response</p>
                    <p>Your input has been signed and processed. Generating response...</p>
                  </div>
                )}
                
                {pendingOutputSignature && (
                  <div className="p-3 bg-purple-100 text-purple-800 rounded-md">
                    <p className="font-medium">Review Generated Response</p>
                    <div className="max-h-32 overflow-y-auto mt-2 p-2 bg-white rounded border">
                      <p className="whitespace-pre-line">{mockResponse}</p>
                    </div>
                    <p className="mt-2">To receive this output, please sign a transaction for {pendingOutputCost} tokens.</p>
                  </div>
                )}
                
                {outputText && !pendingOutputSignature && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Output
                    </label>
                    <div className="w-full p-4 border rounded-md bg-gray-50 whitespace-pre-line">
                      {outputText}
                    </div>
                  </div>
                )}
                
                {!hasAvailableTokens && (
                  <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md">
                    <p className="font-medium">Out of tokens!</p>
                    <p>Purchase more tokens to continue using the LLM service.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Purchase Tokens</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ETH Amount (min 0.002)
                  </label>
                  <input
                    type="number"
                    min="0.002"
                    step="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing || !amount}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isPurchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </div>
              {purchaseSuccess && (
                <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-md">
                  Transaction successful! Your tokens have been purchased.
                </div>
              )}
            </div>
            
            {poolBalance && (
              <div className="p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Total Pool Balance</h2>
                <p className="text-2xl font-bold">{ethers.formatEther(poolBalance)} ETH</p>
              </div>
            )}
            
            {/* Owner-only functions */}
            {isOwner && (
              <div className="space-y-6 p-4 border rounded-lg bg-yellow-50">
                <h2 className="text-xl font-semibold">Owner Functions</h2>
                
                <div className="p-4 border rounded-lg bg-white">
                  <h3 className="text-lg font-medium mb-3">Withdraw Funds</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ETH Amount
                      </label>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing}
                        className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        {isWithdrawing ? 'Processing...' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                  {withdrawSuccess && (
                    <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-md">
                      Withdrawal successful!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
