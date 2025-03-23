import { useState } from 'react';
import { ethers } from 'ethers';

export default function useWithdrawFromPool(contract, llmEntries, fetchLLMEntries) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [withdrawData, setWithdrawData] = useState({
    llmId: '',
  });

  const handleWithdrawFormChange = (e) => {
    const { name, value } = e.target;
    setWithdrawData({
      ...withdrawData,
      [name]: value,
    });
  };

  const handleWithdraw = async () => {
    try {
      if (!contract) return;
      
      setIsWithdrawing(true);
      setResultMessage('');
      
      const { llmId } = withdrawData;
      console.log(`Starting withdrawal process for LLM ID: ${llmId}`);
      
      if (!llmId || isNaN(parseInt(llmId))) {
        setResultMessage('Please provide a valid LLM ID');
        setIsWithdrawing(false);
        return;
      }
      
      // Get LLM entry to check owners and pool balance
      const llmIndex = parseInt(llmId);
      console.log(`LLM index: ${llmIndex}`);
      
      if (!llmEntries || llmIndex >= llmEntries.length) {
        setResultMessage('Invalid LLM ID or entries not loaded');
        setIsWithdrawing(false);
        return;
      }
      
      const entry = llmEntries[llmIndex];
      console.log(`LLM entry:`, entry);
      
      // Check for valid owner addresses
      if (!entry) {
        setResultMessage('LLM entry not found');
        setIsWithdrawing(false);
        return;
      }
      
      console.log("Owner addresses:", entry.owner1, entry.owner2);
      
      if (entry.owner1 === ethers.ZeroAddress) {
        setResultMessage('Owner 1 address is not set (address zero)');
        setIsWithdrawing(false);
        return;
      }
      
      if (entry.owner2 === ethers.ZeroAddress) {
        setResultMessage('Owner 2 address is not set (address zero)');
        setIsWithdrawing(false);
        return;
      }
      
      // Check if pool has any balance
      console.log("Pool balance:", entry.poolBalance.toString());
      
      // Better handling for pool balance check
      let poolBalance;
      try {
        // Ensure we're working with a valid BigNumber
        poolBalance = BigInt(entry.poolBalance.toString());
        console.log("Pool balance as BigInt:", poolBalance.toString());
        
        if (poolBalance <= BigInt(0)) {
          setResultMessage('Pool is empty');
          setIsWithdrawing(false);
          return;
        }
      } catch (error) {
        console.error("Error converting pool balance:", error);
        setResultMessage('Error reading pool balance');
        setIsWithdrawing(false);
        return;
      }
      
      try {
        // Try to estimate gas first to verify if the transaction will succeed
        await contract.withdrawFromPool.estimateGas(llmIndex);
        
        // If estimation is successful, proceed with the transaction
        const tx = await contract.withdrawFromPool(llmIndex);
        await tx.wait();
        
        // Format safely
        let amountWithdrawn;
        try {
          amountWithdrawn = ethers.formatEther(entry.poolBalance);
        } catch (error) {
          console.error("Error formatting balance:", error);
          amountWithdrawn = "some";
        }
        
        setResultMessage(`Successfully withdrew ${amountWithdrawn} ETH from pool and split it between the owners!`);
        
        // Update LLM entries
        if (fetchLLMEntries) {
          fetchLLMEntries();
        }
      } catch (error) {
        console.error("Transaction error:", error);
        
        // Provide more specific error messages
        if (error.message.includes("Pool is empty")) {
          setResultMessage("Error: Pool is empty");
        } else if (error.message.includes("Invalid owner addresses")) {
          setResultMessage("Error: One or both owner addresses are invalid");
        } else if (error.message.includes("Invalid LLM id")) {
          setResultMessage("Error: Invalid LLM ID");
        } else {
          setResultMessage(`Error with transaction: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      setResultMessage(`Error: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getPoolBalance = () => {
    const { llmId } = withdrawData;
    if (llmEntries && llmId && !isNaN(parseInt(llmId)) && parseInt(llmId) < llmEntries.length) {
      try {
        return ethers.formatEther(llmEntries[parseInt(llmId)].poolBalance);
      } catch (error) {
        console.error("Error formatting pool balance:", error);
        return "0";
      }
    }
    return "0";
  };

  const isPoolEmpty = () => {
    const { llmId } = withdrawData;
    if (llmEntries && llmId && !isNaN(parseInt(llmId)) && parseInt(llmId) < llmEntries.length) {
      return !llmEntries[parseInt(llmId)].poolBalance || llmEntries[parseInt(llmId)].poolBalance.toString() === '0';
    }
    return true;
  };

  return {
    isWithdrawing,
    resultMessage,
    withdrawData,
    handleWithdrawFormChange,
    handleWithdraw,
    getPoolBalance,
    isPoolEmpty
  };
} 