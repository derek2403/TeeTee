import { useState } from 'react';
import { ethers } from 'ethers';

export const useRemoveHostedLLM = (contract, fetchLLMEntries) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeData, setRemoveData] = useState({
    llmId: '',
  });
  const [resultMessage, setResultMessage] = useState('');

  // Handle form input changes
  const handleRemoveFormChange = (e) => {
    const { name, value } = e.target;
    setRemoveData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Remove LLM function
  const handleRemove = async () => {
    if (!contract) {
      setResultMessage('Error: Contract not initialized');
      return;
    }

    try {
      setIsRemoving(true);
      setResultMessage('');

      const llmId = parseInt(removeData.llmId);
      if (isNaN(llmId)) {
        throw new Error('Please enter a valid LLM ID');
      }

      // Call the removeHostedLLM function
      const tx = await contract.removeHostedLLM(llmId);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Update LLM entries list
      if (fetchLLMEntries) {
        await fetchLLMEntries();
      }

      setResultMessage(`Successfully removed LLM with ID ${llmId}`);
      
      // Reset form
      setRemoveData({
        llmId: '',
      });
    } catch (error) {
      console.error('Error removing hosted LLM:', error);
      setResultMessage(`Error: ${error.message || 'Failed to remove LLM'}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    isRemoving,
    removeData,
    handleRemoveFormChange,
    handleRemove,
    resultMessage,
  };
};

export default useRemoveHostedLLM; 