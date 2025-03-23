import { useState } from 'react';

export default function useCheckBalance() {
  const [tokenBalance, setTokenBalance] = useState('0');

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

  return {
    tokenBalance,
    fetchTokenBalance,
  };
} 