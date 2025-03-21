import { useState, useEffect } from 'react';

export function useAIChat(tokenCredits) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingOutputSignature, setPendingOutputSignature] = useState(false);
  const [pendingOutputCost, setPendingOutputCost] = useState(0);
  const [tokenUsageHistory, setTokenUsageHistory] = useState([]);
  const [mockResponse, setMockResponse] = useState('');
  
  // Reset chat
  const resetChat = () => {
    setMessages([]);
    setInputText('');
    setTokenUsageHistory([]);
    setIsGenerating(false);
    setPendingOutputSignature(false);
    setPendingOutputCost(0);
    setMockResponse('');
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Generate response and sign input transaction
  const generateResponse = async (shouldUseTokens = true) => {
    if (!inputText.trim()) return;
    if (shouldUseTokens && !tokenCredits.isConnected) return;
    
    const inputTokenCost = Math.ceil(inputText.length / 4); // Simplified: 4 characters = 1 token
    
    // Check if user has enough tokens (only when using token model)
    if (shouldUseTokens) {
      const availableTokens = parseInt(tokenCredits.tokenBalance);
      if (availableTokens < inputTokenCost) {
        alert(`Not enough tokens. Input requires ${inputTokenCost} tokens but you only have ${availableTokens}.`);
        return;
      }
    }
    
    // Start generating
    setIsGenerating(true);
    
    // Add user message to the chat (with or without tokens based on model)
    const newUserMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      tokens: shouldUseTokens ? inputTokenCost : null
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    // Add to usage history if using tokens
    if (shouldUseTokens) {
      setTokenUsageHistory(prev => [...prev, {
        type: 'Input (signed)',
        text: inputText,
        tokens: inputTokenCost
      }]);
    
      // Simulate transaction for input tokens
      if (tokenCredits.isConnected) {
        try {
          const success = await tokenCredits.useTokens(inputTokenCost);
          if (!success) {
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          console.error("Error handling input token usage:", error);
          setIsGenerating(false);
          return;
        }
      }
    }
    
    const savedInput = inputText; // Save input before clearing
    setInputText(''); // Clear input for next interaction
    
    // Generate mock response with setTimeout to simulate delay
    setTimeout(() => {
      // Different response based on the model being used
      let response;
      
      if (shouldUseTokens) {
        response = `This is a simulation of an Ollama 3.2 LLM response to: "${savedInput}". 
        
In a real LLM integration, this would be where the actual API response appears. For this simulation, we're just generating dummy text that's approximately twice the length of your input to demonstrate how token usage works.

The important concept here is that both your input and the generated output consume tokens from your balance. In a production system, the token calculation would be more sophisticated than just counting characters.`;
      } else {
        response = `This is a simulation of your own hosted LLM shard responding to: "${savedInput}".

Since you're using your own hosted LLM shard, no tokens have been deducted from your balance. This option allows you to connect to your own compute resources while still benefiting from the TeeTee secure execution environment.

In a production implementation, this would connect to your designated inference endpoint while maintaining the privacy guarantees of the TEE architecture.`;
      }
      
      const outputTokenCost = Math.ceil(response.length / 4); // Simplified: 4 characters = 1 token
      
      if (shouldUseTokens) {
        // Check if user has enough tokens for output
        const remainingTokens = parseInt(tokenCredits.tokenBalance);
        if (remainingTokens < outputTokenCost) {
          // Not enough tokens for full response - need to truncate
          const truncatedResponse = response.substring(0, remainingTokens * 4);
          setMockResponse(truncatedResponse + "... [Response truncated due to insufficient tokens]");
          setPendingOutputCost(remainingTokens); // Charge only what's available
        } else {
          // Enough tokens for full response
          setMockResponse(response);
          setPendingOutputCost(outputTokenCost);
        }
        
        setIsGenerating(false);
        setPendingOutputSignature(true);
      } else {
        // When using self-hosted model, no need for output signature
        // Add the assistant message to chat immediately
        const newAssistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
          tokens: null // No tokens used for self-hosted model
        };
        
        setMessages(prev => [...prev, newAssistantMessage]);
        setIsGenerating(false);
      }
    }, 1500); // 1.5 second delay to simulate processing
  };

  // Sign output transaction to view the response
  const signOutputTransaction = async () => {
    if (!pendingOutputSignature || pendingOutputCost <= 0) return;
    
    // Deduct output tokens upon signature
    try {
      const success = await tokenCredits.useTokens(pendingOutputCost);
      if (!success) {
        return;
      }
    } catch (error) {
      console.error("Error handling output token usage:", error);
      return;
    }
    
    // Add to usage history
    setTokenUsageHistory(prev => [...prev, {
      type: 'Output (signed)',
      text: mockResponse,
      tokens: pendingOutputCost
    }]);
    
    // Add the assistant message to chat
    const newAssistantMessage = {
      role: 'assistant',
      content: mockResponse,
      timestamp: new Date().toISOString(),
      tokens: pendingOutputCost
    };
    
    setMessages(prev => [...prev, newAssistantMessage]);
    
    // Reset pending states
    setPendingOutputSignature(false);
    setPendingOutputCost(0);
    setMockResponse('');
  };

  return {
    inputText,
    messages,
    isGenerating,
    pendingOutputSignature,
    pendingOutputCost,
    tokenUsageHistory,
    mockResponse,
    handleInputChange,
    generateResponse,
    signOutputTransaction,
    resetChat
  };
} 