import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';

export default function TestPage() {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isContractOwner, setIsContractOwner] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  
  // LLM entries state
  const [llmEntries, setLlmEntries] = useState([]);
  const [totalLLMs, setTotalLLMs] = useState(0);
  
  // Token state
  const [tokenBalance, setTokenBalance] = useState('0');
  
  // Form states
  const [formData, setFormData] = useState({
    owner1: '',
    owner2: '',
    url: '',
  });
  const [editData, setEditData] = useState({
    llmId: '',
    newOwner1: '',
    newOwner2: '',
    newUrl: '',
  });
  const [depositData, setDepositData] = useState({
    llmId: '',
    amount: '0.002',
  });
  const [withdrawData, setWithdrawData] = useState({
    llmId: '',
  });
  const [spendTokensData, setSpendTokensData] = useState({
    tokenAmount: '100',
  });
  
  // Process states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSpendingTokens, setIsSpendingTokens] = useState(false); 
  const [refreshData, setRefreshData] = useState(0);
  
  // Result messages
  const [resultMessage, setResultMessage] = useState({ type: '', message: '' });
  
  // Contract address - adjust this to match your deployed contract
  const contractAddress = '0x4785815a0CBA353484D566029471Fa2E4C596a3a';
  
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
        
        // Check if connected user is contract owner
        const ownerAddress = await contract.contractOwner();
        setIsContractOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        
        // Fetch token balance
        fetchTokenBalance(accounts[0], contract);
        
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
      setIsContractOwner(false);
    } else {
      // User switched account
      setAddress(accounts[0]);
      if (contract) {
        const ownerAddress = await contract.contractOwner();
        setIsContractOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        // Update token balance for new account
        fetchTokenBalance(accounts[0], contract);
      }
    }
  };
  
  // Fetch token balance
  const fetchTokenBalance = async (userAddress, contractInstance) => {
    try {
      if (!contractInstance) return;
      
      // Get token balance from contract
      const balance = await contractInstance.checkBalance();
      setTokenBalance(balance.toString());
      
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  // Fetch all LLM entries
  const fetchLLMEntries = async () => {
    try {
      if (!contract) return;
      
      const entries = await contract.getAllHostedLLMs();
      setLlmEntries(entries);
      
      const total = await contract.totalHostedLLMs();
      setTotalLLMs(parseInt(total.toString()));
    } catch (error) {
      console.error("Error fetching LLM entries:", error);
    }
  };
  
  // Handle form input changes for creating new LLM
  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form input changes for editing LLM
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form input changes for deposit
  const handleDepositFormChange = (e) => {
    const { name, value } = e.target;
    setDepositData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form input changes for withdraw
  const handleWithdrawFormChange = (e) => {
    const { name, value } = e.target;
    setWithdrawData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form input changes for spending tokens (user)
  const handleSpendTokensFormChange = (e) => {
    const { name, value } = e.target;
    setSpendTokensData(prev => ({ ...prev, [name]: value }));
  };
  
  // Create new LLM entry
  const handleCreateLLM = async (e) => {
    e.preventDefault();
    
    try {
      if (!contract) return;
      
      setIsCreating(true);
      setResultMessage({ type: '', message: '' });
      
      const { owner1, owner2, url } = formData;
      
      if (!ethers.isAddress(owner1) || !ethers.isAddress(owner2) || !url.trim()) {
        setResultMessage({ 
          type: 'error', 
          message: 'Please provide valid addresses and URL' 
        });
        setIsCreating(false);
        return;
      }
      
      const tx = await contract.createHostedLLM(owner1, owner2, url);
      await tx.wait();
      
      setFormData({ owner1: '', owner2: '', url: '' });
      setIsCreating(false);
      setResultMessage({ 
        type: 'success', 
        message: 'LLM entry created successfully!' 
      });
      
      // Trigger refresh
      setRefreshData(prev => prev + 1);
      
    } catch (error) {
      console.error("Create LLM error:", error);
      setResultMessage({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
      setIsCreating(false);
    }
  };
  
  // Edit LLM entry
  const handleEditLLM = async (e) => {
    e.preventDefault();
    
    try {
      if (!contract) return;
      
      setIsEditing(true);
      setResultMessage({ type: '', message: '' });
      
      const { llmId, newOwner1, newOwner2, newUrl } = editData;
      
      if (!llmId.trim() || isNaN(parseInt(llmId))) {
        setResultMessage({ 
          type: 'error', 
          message: 'Please provide a valid LLM ID' 
        });
        setIsEditing(false);
        return;
      }
      
      // Only validate addresses if they're provided and not "0" (they're optional)
      if (newOwner1 && newOwner1 !== "0" && !ethers.isAddress(newOwner1)) {
        setResultMessage({ 
          type: 'error', 
          message: 'Invalid owner1 address' 
        });
        setIsEditing(false);
        return;
      }
      
      if (newOwner2 && newOwner2 !== "0" && !ethers.isAddress(newOwner2)) {
        setResultMessage({ 
          type: 'error', 
          message: 'Invalid owner2 address' 
        });
        setIsEditing(false);
        return;
      }
      
      // Convert empty strings to zero address, "0" should also be treated as "keep current"
      const owner1Param = newOwner1.trim() && newOwner1 !== "0" ? newOwner1 : ethers.ZeroAddress;
      const owner2Param = newOwner2.trim() && newOwner2 !== "0" ? newOwner2 : ethers.ZeroAddress;
      const urlParam = newUrl.trim() && newUrl !== "0" ? newUrl : "0";
      
      console.log("Editing LLM with params:", {
        llmId: parseInt(llmId),
        owner1: owner1Param,
        owner2: owner2Param,
        url: urlParam
      });
      
      const tx = await contract.editHostedLLM(
        parseInt(llmId), 
        owner1Param, 
        owner2Param, 
        urlParam
      );
      await tx.wait();
      
      setEditData({ llmId: '', newOwner1: '', newOwner2: '', newUrl: '' });
      setIsEditing(false);
      setResultMessage({ 
        type: 'success', 
        message: 'LLM entry updated successfully!' 
      });
      
      // Trigger refresh
      setRefreshData(prev => prev + 1);
      
    } catch (error) {
      console.error("Edit LLM error:", error);
      setResultMessage({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
      setIsEditing(false);
    }
  };
  
  // Deposit to pool and receive tokens
  const handleDeposit = async (e) => {
    e.preventDefault();
    
    try {
      if (!contract) return;
      
      setIsDepositing(true);
      setResultMessage({ type: '', message: '' });
      
      const { llmId, amount } = depositData;
      
      if (!llmId.trim() || isNaN(parseInt(llmId)) || !amount || parseFloat(amount) < 0.002) {
        setResultMessage({ 
          type: 'error', 
          message: 'Please provide valid LLM ID and amount (minimum 0.002 ETH)' 
        });
        setIsDepositing(false);
        return;
      }
      
      const weiAmount = ethers.parseEther(amount);
      const tx = await contract.depositToPool(parseInt(llmId), {
        value: weiAmount
      });
      
      await tx.wait();
      
      setDepositData({ ...depositData, amount: '0.002' });
      setIsDepositing(false);
      setResultMessage({ 
        type: 'success', 
        message: `Successfully deposited ${amount} ETH to pool and received tokens!` 
      });
      
      // Update token balance
      fetchTokenBalance(address, contract);
      
      // Trigger refresh
      setRefreshData(prev => prev + 1);
      
    } catch (error) {
      console.error("Deposit error:", error);
      setResultMessage({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
      setIsDepositing(false);
    }
  };
  
  // Withdraw from pool and split profits between owner1 and owner2
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    try {
      if (!contract) return;
      
      setIsWithdrawing(true);
      setResultMessage({ type: '', message: '' });
      
      const { llmId } = withdrawData;
      
      if (!llmId.trim() || isNaN(parseInt(llmId))) {
        setResultMessage({ 
          type: 'error', 
          message: 'Please provide a valid LLM ID' 
        });
        setIsWithdrawing(false);
        return;
      }
      
      // Get LLM entry to check owners and pool balance
      const llmIndex = parseInt(llmId);
      if (llmIndex >= llmEntries.length) {
        setResultMessage({ 
          type: 'error', 
          message: 'Invalid LLM ID' 
        });
        setIsWithdrawing(false);
        return;
      }
      
      const entry = llmEntries[llmIndex];
      if (entry.owner1 === ethers.ZeroAddress || entry.owner2 === ethers.ZeroAddress) {
        setResultMessage({ 
          type: 'error', 
          message: 'LLM entry has invalid owner addresses' 
        });
        setIsWithdrawing(false);
        return;
      }
      
      // Check if pool has any balance
      if (entry.poolBalance.toString() === '0') {
        setResultMessage({ 
          type: 'error', 
          message: 'Pool is empty' 
        });
        setIsWithdrawing(false);
        return;
      }
      
      const tx = await contract.withdrawFromPool(llmIndex);
      await tx.wait();
      
      setIsWithdrawing(false);
      setResultMessage({ 
        type: 'success', 
        message: `Successfully withdrew ${ethers.formatEther(entry.poolBalance)} ETH from pool and split it between the owners!` 
      });
      
      // Trigger refresh
      setRefreshData(prev => prev + 1);
      
    } catch (error) {
      console.error("Withdraw error:", error);
      setResultMessage({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
      setIsWithdrawing(false);
    }
  };
  
  // User spends their own tokens
  const handleSpendTokens = async (e) => {
    e.preventDefault();
    
    try {
      if (!contract) return;
      
      setIsSpendingTokens(true);
      setResultMessage({ type: '', message: '' });
      
      const { tokenAmount } = spendTokensData;
      
      if (!tokenAmount || parseInt(tokenAmount) <= 0) {
        setResultMessage({ 
          type: 'error', 
          message: 'Please provide a valid token amount' 
        });
        setIsSpendingTokens(false);
        return;
      }
      
      const tx = await contract.useTokens(tokenAmount);
      await tx.wait();
      
      setSpendTokensData({ ...spendTokensData, tokenAmount: '100' });
      setIsSpendingTokens(false);
      setResultMessage({ 
        type: 'success', 
        message: `Successfully used ${tokenAmount} tokens!` 
      });
      
      // Update token balance
      fetchTokenBalance(address, contract);
      
    } catch (error) {
      console.error("Spend tokens error:", error);
      setResultMessage({ 
        type: 'error', 
        message: `Error: ${error.message}` 
      });
      setIsSpendingTokens(false);
    }
  };
  
  // Fill edit form with selected LLM data
  const handleSelectLLM = (index) => {
    const llm = llmEntries[index];
    setEditData({
      llmId: index.toString(),
      newOwner1: '',
      newOwner2: '',
      newUrl: ''
    });
    
    // Also fill the deposit and withdraw forms
    setDepositData({
      ...depositData,
      llmId: index.toString()
    });
    
    setWithdrawData({
      ...withdrawData,
      llmId: index.toString()
    });
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
  
  // Effect to fetch LLM entries whenever connected or data refreshed
  useEffect(() => {
    if (isConnected && contract) {
      fetchLLMEntries();
    }
  }, [isConnected, contract, refreshData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">HostedLLM Contract Tester</h1>
        
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
            <div className="p-4 border rounded-lg bg-blue-50">
              <h2 className="text-xl font-semibold mb-2">Connected Wallet</h2>
              <p className="font-mono">{address}</p>
              <div className="mt-2 bg-blue-100 p-2 rounded-md text-blue-800">
                <p className="font-semibold">Your Token Balance: {tokenBalance} tokens</p>
              </div>
              {isContractOwner && (
                <p className="mt-2 bg-green-100 p-2 rounded-md text-green-800">
                  You are the contract owner.
                </p>
              )}
            </div>
            
            {resultMessage.type && (
              <div className={`p-4 rounded-md ${
                resultMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {resultMessage.message}
              </div>
            )}
            
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Hosted LLM Entries (Total: {totalLLMs})</h2>
              
              {llmEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner 1</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner 2</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {llmEntries.map((llm, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {llm.owner1.substring(0, 8)}...{llm.owner1.substring(llm.owner1.length - 6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {llm.owner2.substring(0, 8)}...{llm.owner2.substring(llm.owner2.length - 6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <a href={llm.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {llm.url.length > 30 ? `${llm.url.substring(0, 30)}...` : llm.url}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ethers.formatEther(llm.poolBalance)} ETH
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              onClick={() => handleSelectLLM(index)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No LLM entries found. Create one below.</p>
              )}
            </div>
            
            {/* User Deposit Section */}
            <div className="p-4 border rounded-lg bg-purple-50">
              <h2 className="text-xl font-semibold mb-4">Purchase Tokens</h2>
              <p className="text-sm text-gray-600 mb-3">Deposit ETH to purchase tokens. For every 0.002 ETH, you'll receive 100,000 tokens.</p>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LLM ID</label>
                  <input
                    type="number"
                    name="llmId"
                    value={depositData.llmId}
                    onChange={handleDepositFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETH, min 0.002)</label>
                  <input
                    type="number"
                    name="amount"
                    value={depositData.amount}
                    onChange={handleDepositFormChange}
                    step="0.001"
                    min="0.002"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You'll receive approximately {depositData.amount && !isNaN(parseFloat(depositData.amount)) ? 
                      Math.floor((parseFloat(depositData.amount) / 0.002) * 100000) : 0} tokens
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isDepositing || !depositData.llmId}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {isDepositing ? 'Processing...' : 'Deposit & Get Tokens'}
                </button>
              </form>
            </div>
            
            {/* User Spend Tokens Section */}
            <div className="p-4 border rounded-lg bg-teal-50">
              <h2 className="text-xl font-semibold mb-4">Use Your Tokens</h2>
              <p className="text-sm text-gray-600 mb-3">Spend your tokens to use LLM services.</p>
              <form onSubmit={handleSpendTokens} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Amount to Use</label>
                  <input
                    type="number"
                    name="tokenAmount"
                    value={spendTokensData.tokenAmount}
                    onChange={handleSpendTokensFormChange}
                    className="w-full p-2 border rounded-md"
                    min="1"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSpendingTokens || parseInt(tokenBalance) <= 0}
                  className="w-full px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400"
                >
                  {isSpendingTokens ? 'Processing...' : 'Use Tokens'}
                </button>
                {parseInt(tokenBalance) <= 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    You don't have enough tokens. Purchase some above.
                  </p>
                )}
              </form>
            </div>
            
            {/* Create LLM Form */}
            <div className="p-4 border rounded-lg bg-green-50">
              <h2 className="text-xl font-semibold mb-4">Create New Hosted LLM</h2>
              <form onSubmit={handleCreateLLM} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner 1 Address</label>
                    <input
                      type="text"
                      name="owner1"
                      value={formData.owner1}
                      onChange={handleCreateFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner 2 Address</label>
                    <input
                      type="text"
                      name="owner2"
                      value={formData.owner2}
                      onChange={handleCreateFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="0x..."
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleCreateFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isCreating ? 'Creating...' : 'Create Hosted LLM'}
                </button>
              </form>
            </div>
            
            {/* Edit LLM Form */}
            <div className="p-4 border rounded-lg bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Edit Hosted LLM</h2>
              <form onSubmit={handleEditLLM} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LLM ID</label>
                  <input
                    type="number"
                    name="llmId"
                    value={editData.llmId}
                    onChange={handleEditFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Use the "Select" button above to fill this automatically</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Owner 1 (optional)</label>
                    <input
                      type="text"
                      name="newOwner1"
                      value={editData.newOwner1}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Leave blank or enter 0 to keep current"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Owner 2 (optional)</label>
                    <input
                      type="text"
                      name="newOwner2"
                      value={editData.newOwner2}
                      onChange={handleEditFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Leave blank or enter 0 to keep current"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New URL (optional)</label>
                  <input
                    type="url"
                    name="newUrl"
                    value={editData.newUrl}
                    onChange={handleEditFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Leave blank or enter 0 to keep current"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isEditing || !editData.llmId}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  {isEditing ? 'Updating...' : 'Update Hosted LLM'}
                </button>
              </form>
            </div>
                
            {/* Withdraw from Pool */}
            <div className="p-4 border rounded-lg bg-red-50">
              <h2 className="text-xl font-semibold mb-4">Withdraw from Pool</h2>
              <p className="text-sm text-gray-600 mb-3">Withdraws the entire ETH balance from the pool and automatically splits it between the two LLM owners.</p>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LLM ID</label>
                  <input
                    type="number"
                    name="llmId"
                    value={withdrawData.llmId}
                    onChange={handleWithdrawFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Pool Balance: {withdrawData.llmId && !isNaN(parseInt(withdrawData.llmId)) && parseInt(withdrawData.llmId) < llmEntries.length 
                      ? `${ethers.formatEther(llmEntries[parseInt(withdrawData.llmId)].poolBalance)} ETH` 
                      : "0 ETH"}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isWithdrawing || !withdrawData.llmId || (withdrawData.llmId && !isNaN(parseInt(withdrawData.llmId)) && parseInt(withdrawData.llmId) < llmEntries.length && llmEntries[parseInt(withdrawData.llmId)].poolBalance.toString() === '0')}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw & Split Between Owners'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
