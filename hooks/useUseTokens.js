import { useState } from 'react';
import { ethers } from 'ethers';

export default function useUseTokens(contract, address, fetchTokenBalance) {
  const [isSpendingTokens, setIsSpendingTokens] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: '', message: '' });
  const [spendTokensData, setSpendTokensData] = useState({
    tokenAmount: '100',
  });

  const handleSpendTokensFormChange = (e) => {
    const { name, value } = e.target;
    setSpendTokensData(prev => ({ ...prev, [name]: value }));
  };

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

  return {
    isSpendingTokens,
    resultMessage,
    spendTokensData,
    handleSpendTokensFormChange,
    handleSpendTokens,
    setResultMessage,
  };
} 