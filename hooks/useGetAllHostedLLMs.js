import { useState } from 'react';

export default function useGetAllHostedLLMs(contract) {
  const [llmEntries, setLlmEntries] = useState([]);
  const [totalLLMs, setTotalLLMs] = useState(0);

  const fetchLLMEntries = async () => {
    try {
      if (!contract) return;
      
      const entries = await contract.getAllHostedLLMs();
      setLlmEntries(entries);
      
      const total = await contract.totalHostedLLMs();
      setTotalLLMs(parseInt(total.toString()));
    } catch (error) {
      console.error("Error fetching LLM entries:", error);
    }
  };

  return {
    llmEntries,
    totalLLMs,
    fetchLLMEntries,
  };
} 