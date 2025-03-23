import { useState } from 'react';
import { ethers } from 'ethers';

export default function useEditHostedLLM(contract, address, fetchLLMEntries) {
  const [isEditingLLM, setIsEditingLLM] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [editLLMData, setEditLLMData] = useState({
    llmId: '',
    owner1: '',
    owner2: '',
    url: '',
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
      
      // Handle owner addresses
      let owner1 = editLLMData.owner1;
      let owner2 = editLLMData.owner2;
      
      // If owner1 is "0", use Zero Address to keep current value
      if (owner1 === "0" || !owner1) {
        owner1 = ethers.ZeroAddress;
      } else {
        // Validate address format
        if (!ethers.isAddress(owner1)) {
          setResultMessage('Invalid owner1 address format');
          setIsEditingLLM(false);
          return;
        }
      }
      
      // Same logic for owner2
      if (owner2 === "0" || !owner2) {
        owner2 = ethers.ZeroAddress;
      } else {
        if (!ethers.isAddress(owner2)) {
          setResultMessage('Invalid owner2 address format');
          setIsEditingLLM(false);
          return;
        }
      }
      
      // Handle URL update
      let url = editLLMData.url;
      if (!url || url === "0") {
        url = "0"; // Special value for "no change" in contract
      }

      // Update the LLM entry
      const tx = await contract.editHostedLLM(
        llmId,
        owner1,
        owner2,
        url
      );

      await tx.wait();
      
      // Reset form and update state
      setEditLLMData({
        llmId: '',
        owner1: '',
        owner2: '',
        url: '',
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