import { useState } from 'react';
import { ethers } from 'ethers';

export default function useCreateHostedLLM(contract, address, fetchLLMEntries) {
  const [isCreatingLLM, setIsCreatingLLM] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [newLLMData, setNewLLMData] = useState({
    owner1: '',
    owner2: '',
    url: '',
  });

  const handleCreateLLMFormChange = (e) => {
    const { name, value } = e.target;
    setNewLLMData({
      ...newLLMData,
      [name]: value,
    });
  };

  const handleCreateLLM = async () => {
    try {
      if (!contract) return;
      setIsCreatingLLM(true);
      setResultMessage('');

      // Validate owner addresses
      let owner1 = newLLMData.owner1 || address;
      let owner2 = newLLMData.owner2 || address;

      if (!ethers.isAddress(owner1)) {
        setResultMessage('Invalid owner1 address');
        setIsCreatingLLM(false);
        return;
      }

      if (!ethers.isAddress(owner2)) {
        setResultMessage('Invalid owner2 address');
        setIsCreatingLLM(false);
        return;
      }

      // Validate URL
      if (!newLLMData.url) {
        setResultMessage('Please enter a URL');
        setIsCreatingLLM(false);
        return;
      }

      // Create the LLM entry
      const tx = await contract.createHostedLLM(
        owner1,
        owner2,
        newLLMData.url
      );

      await tx.wait();
      
      // Reset form and update state
      setNewLLMData({
        owner1: '',
        owner2: '',
        url: '',
      });
      
      setResultMessage('LLM created successfully!');
      fetchLLMEntries();
    } catch (error) {
      console.error('Error creating LLM:', error);
      setResultMessage(`Error creating LLM: ${error.message}`);
    } finally {
      setIsCreatingLLM(false);
    }
  };

  return {
    isCreatingLLM,
    resultMessage,
    newLLMData,
    handleCreateLLMFormChange,
    handleCreateLLM,
  };
} 