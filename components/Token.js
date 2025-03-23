import { useState, useEffect, useRef } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useAccount, useBalance } from 'wagmi';

const Token = ({ tokenBalance, onClose, isDropdown = false }) => {
  const popupRef = useRef(null);
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Get wallet info
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({
    address: address,
    watch: true,
  });
  
  // Calculate token amount based on ETH input (0.002 ETH = 100,000 tokens)
  useEffect(() => {
    if (ethAmount && !isNaN(parseFloat(ethAmount))) {
      const calculatedTokens = (parseFloat(ethAmount) / 0.002) * 100000;
      setTokenAmount(calculatedTokens.toLocaleString());
    } else {
      setTokenAmount('');
    }
  }, [ethAmount]);
  
  // Handle ETH input change
  const handleEthChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseFloat(value))) {
      setEthAmount(value);
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
      
      {/* Purchase button */}
      <div className="px-4 pb-4">
        <button 
          className={`w-full py-3 px-4 rounded-full text-lg font-medium ${
            ethAmount && parseFloat(ethAmount) >= 0.002 
              ? 'bg-blue-500 text-white' 
              : 'bg-blue-200 text-white cursor-not-allowed'
          }`}
          disabled={!ethAmount || parseFloat(ethAmount) < 0.002}
          onClick={() => {
            if (ethAmount && parseFloat(ethAmount) >= 0.002) {
              // Here you would implement the actual purchase logic
              alert(`Purchase of ${tokenAmount} tokens initiated!`);
              // onClose(); // Uncomment this to close after purchase
            }
          }}
        >
          Purchase
        </button>
        {(ethAmount && parseFloat(ethAmount) < 0.002) && (
          <p className="text-xs text-red-500 mt-1 text-center">
            Minimum purchase amount is 0.002 ETH
          </p>
        )}
      </div>
    </div>
  );
};

export default Token; 