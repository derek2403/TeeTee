import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';
import {
  useCheckBalance,
  useCreateHostedLLM,
  useDepositToPool,
  useEditHostedLLM,
  useGetAllHostedLLMs,
  useUseTokens,
  useWithdrawFromPool,
} from '../hooks';

export default function TestPage() {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isContractOwner, setIsContractOwner] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  
  // Contract address - adjust this to match your deployed contract
  const contractAddress = '0x4785815a0CBA353484D566029471Fa2E4C596a3a';
  
  // Custom hooks
  const { tokenBalance, fetchTokenBalance } = useCheckBalance(contract);
  const { llmEntries, totalLLMs, fetchLLMEntries } = useGetAllHostedLLMs(contract);
  const { 
    isCreatingLLM, 
    newLLMData, 
    handleCreateLLMFormChange, 
    handleCreateLLM 
  } = useCreateHostedLLM(contract, address, fetchLLMEntries);
  const { 
    isEditingLLM, 
    editLLMData, 
    handleEditLLMFormChange, 
    handleEditLLM 
  } = useEditHostedLLM(contract, address, fetchLLMEntries);
  const { 
    isDepositing, 
    depositData, 
    handleDepositFormChange, 
    handleDeposit 
  } = useDepositToPool(contract, fetchTokenBalance);
  const { 
    isWithdrawing, 
    withdrawData, 
    handleWithdrawFormChange, 
    handleWithdraw 
  } = useWithdrawFromPool(contract, llmEntries, fetchLLMEntries);
  const { 
    isSpendingTokens, 
    spendTokensData, 
    handleSpendTokensFormChange, 
    handleSpendTokens 
  } = useUseTokens(contract, address, fetchTokenBalance);
  
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
        fetchTokenBalance();
      }
    }
  };
  
  // Fill edit form with selected LLM data
  const handleSelectLLM = (index) => {
    // Set LLM ID for edit, deposit, and withdraw forms
    handleEditLLMFormChange({ target: { name: 'llmId', value: index.toString() } });
    handleDepositFormChange({ target: { name: 'llmId', value: index.toString() } });
    handleWithdrawFormChange({ target: { name: 'llmId', value: index.toString() } });
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
  
  // Effect to fetch initial data when connected
  useEffect(() => {
    if (isConnected && contract) {
      fetchLLMEntries();
      fetchTokenBalance();
    }
  }, [isConnected, contract]);
  
  // Set global result message by watching hook messages
  useEffect(() => {
    // Priority order for messages
    if (isCreatingLLM?.resultMessage) setResultMessage(isCreatingLLM.resultMessage);
    else if (isEditingLLM?.resultMessage) setResultMessage(isEditingLLM.resultMessage);
    else if (isDepositing?.resultMessage) setResultMessage(isDepositing.resultMessage);
    else if (isWithdrawing?.resultMessage) setResultMessage(isWithdrawing.resultMessage);
    else if (isSpendingTokens?.resultMessage) setResultMessage(isSpendingTokens.resultMessage);
  }, [
    isCreatingLLM?.resultMessage,
    isEditingLLM?.resultMessage,
    isDepositing?.resultMessage,
    isWithdrawing?.resultMessage,
    isSpendingTokens?.resultMessage
  ]);

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
            
            {resultMessage && (
              <div className={`p-4 rounded-md ${
                resultMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {resultMessage}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 overflow-hidden text-ellipsis" style={{ maxWidth: '200px' }}>
                            <a href={llm.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {llm.url.length > 30 ? `${llm.url.substring(0, 30)}...` : llm.url}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {safeFormatEther(llm.poolBalance)} ETH
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
              <form onSubmit={(e) => { e.preventDefault(); handleDeposit(); }} className="space-y-4">
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
                  <p className="text-sm text-gray-500 mt-1">Use the "Select" button above to fill this automatically</p>
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
                  disabled={isDepositing}
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
              <form onSubmit={(e) => { e.preventDefault(); handleSpendTokens(); }} className="space-y-4">
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
              <form onSubmit={(e) => { e.preventDefault(); handleCreateLLM(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    name="url"
                    value={newLLMData.url}
                    onChange={handleCreateLLMFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://example.com"
                    required
                  />
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner 1 Address</label>
                    <input
                      type="text"
                      name="owner1"
                      value={newLLMData.owner1}
                      onChange={handleCreateLLMFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder={address}
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave blank to use your address</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner 2 Address</label>
                    <input
                      type="text"
                      name="owner2"
                      value={newLLMData.owner2}
                      onChange={handleCreateLLMFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder={address}
                    />
                    <p className="text-sm text-gray-500 mt-1">Leave blank to use your address</p>
                  </div>
                  </div>
                <button
                  type="submit"
                  disabled={isCreatingLLM}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isCreatingLLM ? 'Creating...' : 'Create Hosted LLM'}
                </button>
              </form>
            </div>
            
            {/* Edit LLM Form */}
            <div className="p-4 border rounded-lg bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Edit Hosted LLM</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleEditLLM(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LLM ID</label>
                  <input
                    type="number"
                    name="llmId"
                    value={editLLMData.llmId}
                    onChange={handleEditLLMFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Use the "Select" button above to fill this automatically</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New URL (optional)</label>
                  <input
                    type="url"
                    name="url"
                    value={editLLMData.url}
                    onChange={handleEditLLMFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Leave blank or enter 0 to keep current"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Owner 1 (optional)</label>
                    <input
                      type="text"
                      name="owner1"
                      value={editLLMData.owner1}
                      onChange={handleEditLLMFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Leave blank or enter 0 to keep current"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Owner 2 (optional)</label>
                    <input
                      type="text"
                      name="owner2"
                      value={editLLMData.owner2}
                      onChange={handleEditLLMFormChange}
                      className="w-full p-2 border rounded-md"
                      placeholder="Leave blank or enter 0 to keep current"
                    />
              </div>
                </div>
                <button
                  type="submit"
                  disabled={isEditingLLM || !editLLMData.llmId}
                  className="w-full px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  {isEditingLLM ? 'Updating...' : 'Update Hosted LLM'}
                </button>
              </form>
            </div>
                
            {/* Withdraw from Pool */}
            <div className="p-4 border rounded-lg bg-red-50">
              <h2 className="text-xl font-semibold mb-4">Withdraw from Pool</h2>
              <p className="text-sm text-gray-600 mb-3">Withdraws the entire ETH balance from the pool and automatically splits it between the two LLM owners.</p>
              <form onSubmit={(e) => { e.preventDefault(); handleWithdraw(); }} className="space-y-4">
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
                    Selected Pool Balance: {withdrawData.llmId && !isNaN(parseInt(withdrawData.llmId)) && 
                      parseInt(withdrawData.llmId) < llmEntries.length && llmEntries[parseInt(withdrawData.llmId)]
                      ? `${safeFormatEther(llmEntries[parseInt(withdrawData.llmId)].poolBalance)} ETH` 
                      : "0 ETH"}
                  </p>
                  
                  {/* Debug info */}
                  {withdrawData.llmId && !isNaN(parseInt(withdrawData.llmId)) && 
                   parseInt(withdrawData.llmId) < llmEntries.length && llmEntries[parseInt(withdrawData.llmId)] && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                      <p><strong>Debug Info:</strong></p>
                      <p>Owner 1: {llmEntries[parseInt(withdrawData.llmId)].owner1}</p>
                      <p>Owner 2: {llmEntries[parseInt(withdrawData.llmId)].owner2}</p>
                      <p>Pool Balance (wei): {llmEntries[parseInt(withdrawData.llmId)].poolBalance.toString()}</p>
                      <p>Owner 1 is zero address: {llmEntries[parseInt(withdrawData.llmId)].owner1 === ethers.ZeroAddress ? "Yes" : "No"}</p>
                      <p>Owner 2 is zero address: {llmEntries[parseInt(withdrawData.llmId)].owner2 === ethers.ZeroAddress ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={
                    isWithdrawing || 
                    !withdrawData.llmId || 
                    !llmEntries || 
                    !withdrawData.llmId || 
                    isNaN(parseInt(withdrawData.llmId)) || 
                    parseInt(withdrawData.llmId) >= llmEntries.length || 
                    !llmEntries[parseInt(withdrawData.llmId)] || 
                    !llmEntries[parseInt(withdrawData.llmId)].poolBalance || 
                    llmEntries[parseInt(withdrawData.llmId)].poolBalance.toString() === '0' ||
                    llmEntries[parseInt(withdrawData.llmId)].owner1 === ethers.ZeroAddress ||
                    llmEntries[parseInt(withdrawData.llmId)].owner2 === ethers.ZeroAddress
                  }
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
