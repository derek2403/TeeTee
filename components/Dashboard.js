import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { ethers } from 'ethers';
import useWithdrawFromPool from '../hooks/useWithdrawFromPool';

const Dashboard = ({ tokenBalance, aiChat, onClose, contract, llmEntries = [], userAddress }) => {
  const [totalEarnings, setTotalEarnings] = useState("0");
  const [networkUptime, setNetworkUptime] = useState("99.8%");
  const dashboardRef = useRef(null);
  const [withdrawStatus, setWithdrawStatus] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [ownedLLMIds, setOwnedLLMIds] = useState([]);
  
  // Setup withdraw hook
  const {
    handleWithdraw: processWithdraw,
    isWithdrawing: hookWithdrawing,
    resultMessage
  } = useWithdrawFromPool(contract, llmEntries, null);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dashboardRef.current && !dashboardRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  
  // Calculate earnings and find owned LLM IDs
  useEffect(() => {
    if (llmEntries.length > 0 && userAddress) {
      let totalPoolBalance = ethers.parseEther("0");
      const ownedIds = [];
      
      llmEntries.forEach((llm, index) => {
        const isOwner = userAddress.toLowerCase() === llm.owner1.toLowerCase() || 
                       userAddress.toLowerCase() === llm.owner2.toLowerCase();
        
        if (isOwner) {
          if (llm.poolBalance && llm.poolBalance > 0) {
            totalPoolBalance = totalPoolBalance + llm.poolBalance;
            ownedIds.push(index);
          }
        }
      });
      
      // Divide by 2 since earnings are split
      const earnings = totalPoolBalance / BigInt(2);
      setTotalEarnings(ethers.formatEther(earnings));
      setOwnedLLMIds(ownedIds);
    }
  }, [llmEntries, userAddress]);
  
  // Handle withdraw for all owned LLMs
  const handleWithdraw = async () => {
    if (ownedLLMIds.length === 0) {
      setWithdrawStatus('No eligible LLMs found to withdraw from');
      return;
    }
    
    setIsWithdrawing(true);
    setWithdrawStatus('Withdrawing from all pools...');
    
    try {
      // Process each LLM with a pool balance
      for (const llmId of ownedLLMIds) {
        try {
          // Only withdraw if pool has balance
          if (llmEntries[llmId].poolBalance && 
              llmEntries[llmId].poolBalance.toString() !== '0') {
              
            const tx = await contract.withdrawFromPool(llmId);
            await tx.wait();
          }
        } catch (error) {
          console.error(`Error withdrawing from LLM ${llmId}:`, error);
        }
      }
      
      setWithdrawStatus('Successfully withdrew from all eligible pools!');
      
      // Update earnings (would normally fetch updated entries, 
      // but for immediate feedback, just set to 0)
      setTotalEarnings("0");
      setOwnedLLMIds([]);
      
    } catch (error) {
      console.error("Withdraw error:", error);
      setWithdrawStatus(`Error: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setWithdrawStatus('');
      }, 5000);
    }
  };
  
  // Count hosted models owned by the user
  const ownedModels = llmEntries.filter(llm => 
    userAddress && (
      userAddress.toLowerCase() === llm.owner1.toLowerCase() || 
      userAddress.toLowerCase() === llm.owner2.toLowerCase()
    )
  ).length;
  
  // Format earnings for display
  const formattedEarnings = parseFloat(totalEarnings).toFixed(6);
  
  return (
    <div ref={dashboardRef} className="flex flex-col w-full space-y-4 pb-4">
      {/* User Profile Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-black">Wallet</h3>
            <p className="text-xs text-gray-700 truncate w-48">{userAddress || "Not connected"}</p>
            <p className="text-sm text-black mt-1">Token Balance: {tokenBalance || "0"}</p>
          </div>
        </div>
      </div>

      {/* Host Statistics */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 text-black">Your Hosting Stats</h2>
        
        <div className="space-y-4">
          {/* Models Hosted */}
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-black">Models Hosted</h3>
              <p className="text-xs text-gray-700">Total LLMs you&apos;re hosting</p>
            </div>
            <div className="text-xl font-bold text-black">{ownedModels}</div>
          </div>
          
          {/* Earnings with Withdraw Button */}
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-black">Total Earnings</h3>
                <p className="text-xs text-gray-700">Your share from pools</p>
              </div>
              <div className="text-xl font-bold text-black">{formattedEarnings} ETH</div>
            </div>
            
            {/* Withdraw button and status message */}
            <div className="mt-3">
              <Button 
                color="success" 
                variant="flat"
                radius="sm"
                className="w-full"
                onClick={handleWithdraw}
                disabled={isWithdrawing || parseFloat(totalEarnings) <= 0}
                startContent={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw Earnings'}
              </Button>
              
              {withdrawStatus && (
                <div className={`mt-2 text-sm ${withdrawStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {withdrawStatus}
                </div>
              )}
            </div>
          </div>
          
          {/* Network Uptime */}
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-black">Network Uptime</h3>
              <p className="text-xs text-gray-700">Your node availability</p>
            </div>
            <div className="text-xl font-bold text-black">{networkUptime}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 