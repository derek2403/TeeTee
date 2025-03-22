import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractABI from '../utils/ABI.json';

const contractAddress = '0x2ABf94cB5B0cA6e00f85F77Cc88a17204f511BE7';

export function useTokenCredits() {
  const [amount, setAmount] = useState('0.002');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [poolBalance, setPoolBalance] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // Check if connected user is owner
        const ownerAddress = await contract.owner();
        setIsOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        
        // Initial data fetching
        fetchTokenBalance(accounts[0], contract);
        fetchPoolBalance(contract);
        
        // Setup listeners for account changes
        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } else {
        console.log("No ethereum object found. Please install MetaMask.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };
  
  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setIsConnected(false);
      setAddress('');
      setIsOwner(false);
    } else {
      // User switched account
      setAddress(accounts[0]);
      if (contract) {
        const ownerAddress = await contract.owner();
        setIsOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        fetchTokenBalance(accounts[0], contract);
      }
    }
  };
  
  // Fetch token balance
  const fetchTokenBalance = async (userAddress, contractInstance) => {
    try {
      if (!contractInstance) return;
      
      // Try using checkBalance first
      try {
        const balance = await contractInstance.checkBalance();
        setTokenBalance(balance.toString());
      } catch (error) {
        // Fallback to mapping
        const balance = await contractInstance.tokenBalances(userAddress);
        setTokenBalance(balance.toString());
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  // Fetch pool balance
  const fetchPoolBalance = async (contractInstance) => {
    try {
      if (!contractInstance) return;
      
      const balance = await contractInstance.totalPoolBalance();
      setPoolBalance(balance);
    } catch (error) {
      console.error("Error fetching pool balance:", error);
    }
  };
  
  // Purchase tokens
  const handlePurchase = async () => {
    try {
      if (!contract) return;
      
      setIsPurchasing(true);
      setPurchaseSuccess(false);
      
      const weiAmount = ethers.parseEther(amount);
      const tx = await contract.purchaseTokens(weiAmount, {
        value: weiAmount
      });
      
      await tx.wait();
      
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      
      // Refresh data
      fetchTokenBalance(address, contract);
      fetchPoolBalance(contract);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setPurchaseSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error("Purchase error:", error);
      setIsPurchasing(false);
    }
  };

  // Use tokens
  const useTokens = async (tokenAmount) => {
    try {
      if (!contract || !address) return false;
      
      // Check if user has enough tokens
      const currentBalance = parseInt(tokenBalance);
      if (currentBalance < tokenAmount) {
        console.error("Not enough tokens");
        return false;
      }

      // If accessing directly, trigger the contract method
      // This would usually be handled by a backend in production
      const tx = await contract.useTokens(address, tokenAmount);
      await tx.wait();
      
      // Update balance
      fetchTokenBalance(address, contract);
      return true;
    } catch (error) {
      console.error("Error using tokens:", error);
      return false;
    }
  };
  
  // Init effect - check if wallet already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
    
    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  return {
    amount,
    setAmount,
    tokenBalance,
    address,
    isConnected,
    isOwner,
    isPurchasing,
    purchaseSuccess,
    connectWallet,
    handlePurchase,
    useTokens,
    fetchTokenBalance,
    fetchPoolBalance,
    poolBalance
  };
} 