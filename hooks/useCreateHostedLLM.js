import { useState } from 'react';
import { ethers } from 'ethers';

export default function useCreateHostedLLM(contract, address, fetchLLMEntries) {
  const [isCreatingLLM, setIsCreatingLLM] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [newLLMData, setNewLLMData] = useState({
    name: '',
    description: '',
    owner1: '',
    owner2: '',
    price: '0.001',
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

      // Validate inputs
      if (!newLLMData.name || !newLLMData.description) {
        setResultMessage('Please enter a name and description');
        setIsCreatingLLM(false);
        return;
      }

      // Validate owner addresses
      let owner1 = newLLMData.owner1 || address;
      let owner2 = newLLMData.owner2 || address;

      if (!ethers.utils.isAddress(owner1)) {
        setResultMessage('Invalid owner1 address');
        setIsCreatingLLM(false);
        return;
      }

      if (!ethers.utils.isAddress(owner2)) {
        setResultMessage('Invalid owner2 address');
        setIsCreatingLLM(false);
        return;
      }

      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(newLLMData.price);

      // Create the LLM entry
      const tx = await contract.createHostedLLM(
        newLLMData.name,
        newLLMData.description,
        owner1,
        owner2,
        priceInWei
      );

      await tx.wait();
      
      // Reset form and update state
      setNewLLMData({
        name: '',
        description: '',
        owner1: '',
        owner2: '',
        price: '0.001',
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