import { useState } from 'react';
import { ethers } from 'ethers';

export default function useWithdrawFromPool(contract, llmEntries, refreshData, setRefreshData) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: '', message: '' });
  const [withdrawData, setWithdrawData] = useState({
    llmId: '',
  });

  const handleWithdrawFormChange = (e) => {
    const { name, value } = e.target;
    setWithdrawData(prev => ({ ...prev, [name]: value }));
  };

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

  const setWithdrawLLMId = (llmId) => {
    setWithdrawData({
      ...withdrawData,
      llmId: llmId.toString()
    });
  };

  const getPoolBalance = () => {
    const { llmId } = withdrawData;
    if (llmId && !isNaN(parseInt(llmId)) && parseInt(llmId) < llmEntries.length) {
      return ethers.formatEther(llmEntries[parseInt(llmId)].poolBalance);
    }
    return "0";
  };

  const isPoolEmpty = () => {
    const { llmId } = withdrawData;
    if (llmId && !isNaN(parseInt(llmId)) && parseInt(llmId) < llmEntries.length) {
      return llmEntries[parseInt(llmId)].poolBalance.toString() === '0';
    }
    return true;
  };

  return {
    isWithdrawing,
    resultMessage,
    withdrawData,
    handleWithdrawFormChange,
    handleWithdraw,
    setWithdrawLLMId,
    getPoolBalance,
    isPoolEmpty,
    setResultMessage,
  };
} 