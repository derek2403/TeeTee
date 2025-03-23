import { useState } from 'react';
import { ethers } from 'ethers';

export default function useDepositToPool(contract, fetchTokenBalance) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [depositData, setDepositData] = useState({
    amount: '0.002',
  });

  const handleDepositFormChange = (e) => {
    const { name, value } = e.target;
    setDepositData({
      ...depositData,
      [name]: value,
    });
  };

  const handleDeposit = async () => {
    try {
      if (!contract) return;
      setIsDepositing(true);
      setResultMessage('');

      // Validate input
      const amount = depositData.amount;
      if (!amount || parseFloat(amount) <= 0) {
        setResultMessage('Please enter a valid amount');
        setIsDepositing(false);
        return;
      }

      // Convert to wei
      const amountInWei = ethers.utils.parseEther(amount);

      // Make the deposit
      const tx = await contract.depositToPool({
        value: amountInWei,
      });

      await tx.wait();
      
      setResultMessage(`Deposit successful! ${amount} ETH deposited.`);
      
      // Update token balance
      if (fetchTokenBalance) {
        fetchTokenBalance();
      }
    } catch (error) {
      console.error('Error making deposit:', error);
      setResultMessage(`Error making deposit: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    isDepositing,
    resultMessage,
    depositData,
    handleDepositFormChange,
    handleDeposit,
  };
} 