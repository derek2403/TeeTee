import { useState, useEffect } from 'react';

export default function useCheckBalance(contract) {
  const [tokenBalance, setTokenBalance] = useState('0');

  const fetchTokenBalance = async () => {
    try {
      if (!contract) return;
      
      // Get token balance from contract
      const balance = await contract.checkBalance();
      setTokenBalance(balance.toString());
      
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  // Auto-fetch when the contract changes
  useEffect(() => {
    if (contract) {
      fetchTokenBalance();
    }
  }, [contract]);

  return {
    tokenBalance,
    fetchTokenBalance,
  };
} 