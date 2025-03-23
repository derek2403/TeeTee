import { useState } from 'react';
import { ethers } from 'ethers';

export default function useUseTokens(contract, address, fetchTokenBalance) {
  const [isSpendingTokens, setIsSpendingTokens] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [spendTokensData, setSpendTokensData] = useState({
    tokenAmount: '100',
  });

  const handleSpendTokensFormChange = (e) => {
    const { name, value } = e.target;
    setSpendTokensData({
      ...spendTokensData,
      [name]: value,
    });
  };

  const handleSpendTokens = async () => {
    try {
      if (!contract) return;
      
      setIsSpendingTokens(true);
      setResultMessage('');
      
      const { tokenAmount } = spendTokensData;
      
      if (!tokenAmount || parseInt(tokenAmount) <= 0) {
        setResultMessage('Please provide a valid token amount');
        setIsSpendingTokens(false);
        return;
      }
      
      const tx = await contract.useTokens(tokenAmount);
      await tx.wait();
      
      setSpendTokensData({ ...spendTokensData, tokenAmount: '100' });
      setResultMessage(`Successfully used ${tokenAmount} tokens!`);
      
      // Update token balance
      if (fetchTokenBalance) {
        fetchTokenBalance();
      }
      
    } catch (error) {
      console.error("Spend tokens error:", error);
      setResultMessage(`Error: ${error.message}`);
      setIsSpendingTokens(false);
    } finally {
      setIsSpendingTokens(false);
    }
  };

  return {
    isSpendingTokens,
    resultMessage,
    spendTokensData,
    handleSpendTokensFormChange,
    handleSpendTokens,
  };
} 