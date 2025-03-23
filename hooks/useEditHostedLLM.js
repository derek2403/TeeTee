import { useState } from 'react';
import { ethers } from 'ethers';

export default function useEditHostedLLM(contract, address, fetchLLMEntries) {
  const [isEditingLLM, setIsEditingLLM] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [editLLMData, setEditLLMData] = useState({
    llmId: '',
    name: '',
    description: '',
    owner1: '',
    owner2: '',
    price: '',
  });

  const handleEditLLMFormChange = (e) => {
    const { name, value } = e.target;
    setEditLLMData({
      ...editLLMData,
      [name]: value,
    });
  };

  const handleEditLLM = async () => {
    try {
      if (!contract) return;
      setIsEditingLLM(true);
      setResultMessage('');

      // Validate inputs
      if (!editLLMData.llmId) {
        setResultMessage('Please enter a valid LLM ID');
        setIsEditingLLM(false);
        return;
      }

      // Get current LLM data to compare
      const llmId = parseInt(editLLMData.llmId);
      let currentLLM;
      
      try {
        const entries = await contract.getAllHostedLLMs();
        if (llmId >= entries.length) {
          setResultMessage('LLM ID not found');
          setIsEditingLLM(false);
          return;
        }
        currentLLM = entries[llmId];
      } catch (error) {
        setResultMessage('Error fetching LLM data');
        setIsEditingLLM(false);
        return;
      }

      // Prepare updated values
      const name = editLLMData.name || currentLLM.name;
      const description = editLLMData.description || currentLLM.description;
      
      // Handle owner addresses
      let owner1 = editLLMData.owner1;
      let owner2 = editLLMData.owner2;
      
      // If owner1 is "0", keep the current value
      if (owner1 === "0") {
        owner1 = currentLLM.owner1;
      } else if (!owner1) {
        // If empty, use current value
        owner1 = currentLLM.owner1;
      } else {
        // Validate address format
        if (!ethers.utils.isAddress(owner1)) {
          setResultMessage('Invalid owner1 address format');
          setIsEditingLLM(false);
          return;
        }
      }
      
      // Same logic for owner2
      if (owner2 === "0") {
        owner2 = currentLLM.owner2;
      } else if (!owner2) {
        owner2 = currentLLM.owner2;
      } else {
        if (!ethers.utils.isAddress(owner2)) {
          setResultMessage('Invalid owner2 address format');
          setIsEditingLLM(false);
          return;
        }
      }
      
      // Handle price update
      let priceInWei;
      if (editLLMData.price) {
        try {
          priceInWei = ethers.utils.parseEther(editLLMData.price);
        } catch (error) {
          setResultMessage('Invalid price format');
          setIsEditingLLM(false);
          return;
        }
      } else {
        priceInWei = currentLLM.price;
      }

      // Update the LLM entry
      const tx = await contract.editHostedLLM(
        llmId,
        name,
        description,
        owner1,
        owner2,
        priceInWei
      );

      await tx.wait();
      
      // Reset form and update state
      setEditLLMData({
        llmId: '',
        name: '',
        description: '',
        owner1: '',
        owner2: '',
        price: '',
      });
      
      setResultMessage('LLM updated successfully!');
      fetchLLMEntries();
    } catch (error) {
      console.error('Error editing LLM:', error);
      setResultMessage(`Error editing LLM: ${error.message}`);
    } finally {
      setIsEditingLLM(false);
    }
  };

  return {
    isEditingLLM,
    resultMessage,
    editLLMData,
    handleEditLLMFormChange,
    handleEditLLM,
  };
} 