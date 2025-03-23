import { useState, useEffect, useRef } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useAccount, useBalance } from 'wagmi';
import  useDepositToPool  from '../hooks/useDepositToPool';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';

const Token = ({ tokenBalance, onClose, isDropdown = false, contract: externalContract, fetchTokenBalance }) => {
  const popupRef = useRef(null);
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(externalContract);
  
  // Get wallet info
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    address: address,
    watch: true,
  });
  
  // Initialize contract if not provided externally
  useEffect(() => {
    const initContract = async () => {
      if (!contract && window.ethereum && isConnected) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractAddress = '0x4785815a0CBA353484D566029471Fa2E4C596a3a';
          const newContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(newContract);
          console.log("Contract initialized successfully");
        } catch (error) {
          console.error("Failed to initialize contract:", error);
          setError("Failed to initialize contract. Check console for details.");
        }
      }
    };
    
    initContract();
  }, [contract, isConnected]);
  
  // Use the deposit hook for token purchase functionality
  const { 
    isDepositing, 
    resultMessage, 
    depositData, 
    handleDepositFormChange, 
    handleDeposit 
  } = useDepositToPool(contract, fetchTokenBalance);

  // Set fixed LLM ID as per requirement (0)
  useEffect(() => {
    if (contract) {
      handleDepositFormChange({ target: { name: 'llmId', value: '0' }});
    }
  }, [contract]);
  
  // Calculate token amount based on ETH input (0.002 ETH = 100,000 tokens)
  useEffect(() => {
    if (ethAmount && !isNaN(parseFloat(ethAmount))) {
      const calculatedTokens = (parseFloat(ethAmount) / 0.002) * 100000;
      setTokenAmount(calculatedTokens.toLocaleString());
      
      // Update the deposit amount in the hook state
      handleDepositFormChange({ target: { name: 'amount', value: ethAmount }});
    } else {
      setTokenAmount('');
    }
  }, [ethAmount]);
  
  // Handle ETH input change
  const handleEthChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseFloat(value))) {
      setEthAmount(value);
      setError(''); // Clear any previous errors
    }
  };
  
  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle token purchase
  const handleTokenPurchase = async () => {
    try {
      setError('');
      
      // Validation checks
      if (!contract) {
        setError('Smart contract not initialized');
        return;
      }
      
      if (!isConnected) {
        setError('Wallet not connected');
        return;
      }
      
      if (!ethAmount || parseFloat(ethAmount) < 0.002) {
        setError('Minimum amount is 0.002 ETH');
        return;
      }
      
      // Make sure the LLM ID is set properly
      if (depositData.llmId !== '0') {
        handleDepositFormChange({ target: { name: 'llmId', value: '0' }});
      }
      
      // Directly call the contract to ensure we're bypassing any issues with the hook
      if (ethAmount && parseFloat(ethAmount) >= 0.002) {
        console.log('Attempting to purchase tokens...');
        console.log('Contract:', contract);
        console.log('Amount:', ethAmount, 'ETH');
        console.log('LLM ID:', depositData.llmId);
        
        // Call the hook's deposit method
        await handleDeposit();
        
        // Reset fields on success
        if (!resultMessage.includes('Error')) {
          setEthAmount('');
          setTokenAmount('');
        }
      }
    } catch (error) {
      console.error('Token purchase error:', error);
      setError(error.message || 'Error purchasing tokens');
    }
  };

  return (
    <div ref={popupRef} className="flex flex-col w-full">
      {/* Simple token swap UI */}
      <div className="p-4 flex flex-col space-y-4">
        {/* ETH Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg">ETH</span>
          </div>
          <div className="relative">
            <input
              type="text"
              className="w-24 text-right text-xl font-bold bg-transparent border-none focus:outline-none"
              value={ethAmount}
              onChange={handleEthChange}
              placeholder="0"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {isFocused && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center">
                <div className="w-[1px] h-6 bg-black animate-pulse ml-1"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Balance: {ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0'} ETH
        </div>
        
        {/* Arrow between tokens */}
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        {/* TOKEN Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gray-800 rounded-full p-2">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <span className="font-bold text-lg">TOKEN</span>
          </div>
          <div className="text-xl font-bold text-right">
            {tokenAmount || '0'}
          </div>
        </div>
      </div>
      
      {/* Display any errors */}
      {error && (
        <div className="px-4 mb-2 text-sm text-red-500">
          Error: {error}
        </div>
      )}
      
      {/* Display result message if any */}
      {resultMessage && (
        <div className={`px-4 mb-2 text-sm ${
          resultMessage.includes('Error') ? 'text-red-500' : 'text-green-500'
        }`}>
          {resultMessage}
        </div>
      )}

      
      {/* Purchase button */}
      <div className="px-4 pb-4">
        <button 
          className={`w-full py-3 px-4 rounded-full text-lg font-medium ${
            ethAmount && parseFloat(ethAmount) >= 0.002 && !isDepositing && contract && isConnected
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-blue-200 text-white cursor-not-allowed'
          }`}
          disabled={!ethAmount || parseFloat(ethAmount) < 0.002 || isDepositing || !contract || !isConnected}
          onClick={handleTokenPurchase}
        >
          {isDepositing ? 'Processing...' : 'Purchase'}
        </button>
        {(ethAmount && parseFloat(ethAmount) < 0.002) && (
          <p className="text-xs text-red-500 mt-1 text-center">
            Minimum purchase amount is 0.002 ETH
          </p>
        )}
        
        {/* Show current token balance if available */}
        {tokenBalance && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Your current token balance: {tokenBalance}
          </p>
        )}
      </div>
    </div>
  );
};

export default Token; 