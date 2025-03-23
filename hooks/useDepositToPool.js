import { useState } from 'react';
import { ethers } from 'ethers';

export default function useDepositToPool(contract, fetchTokenBalance) {
  const [isDepositing, setIsDepositing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [depositData, setDepositData] = useState({
    amount: '0.002',
    llmId: '0'
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

      // Validate llmId
      const llmId = parseInt(depositData.llmId);
      if (isNaN(llmId)) {
        setResultMessage('Please enter a valid LLM ID');
        setIsDepositing(false);
        return;
      }

      // Convert to wei
      const amountInWei = ethers.parseEther(amount);

      // Make the deposit - in ethers v6, we need to pass arguments and then options
      const tx = await contract.depositToPool(
        llmId,  // First argument is the llmId
        { value: amountInWei }  // Transaction options including ETH value to send
      );

      await tx.wait();
      
      setResultMessage(`Deposit successful! ${amount} ETH deposited to LLM ID ${llmId}.`);
      
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