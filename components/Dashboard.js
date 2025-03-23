import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { ethers } from 'ethers';

const Dashboard = ({ tokenBalance, aiChat, onClose, contract, llmEntries = [], userAddress }) => {
  const [totalEarnings, setTotalEarnings] = useState("0");
  const [networkUptime, setNetworkUptime] = useState("99.8%");
  const dashboardRef = useRef(null);
  
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
  
  // Calculate earnings (poolBalance/2) from models owned by the user
  useEffect(() => {
    if (llmEntries.length > 0 && userAddress) {
      let totalPoolBalance = ethers.parseEther("0");
      
      llmEntries.forEach(llm => {
        const isOwner = userAddress.toLowerCase() === llm.owner1.toLowerCase() || 
                       userAddress.toLowerCase() === llm.owner2.toLowerCase();
        
        if (isOwner && llm.poolBalance) {
          totalPoolBalance = totalPoolBalance + llm.poolBalance;
        }
      });
      
      // Divide by 2 since earnings are split
      const earnings = totalPoolBalance / BigInt(2);
      setTotalEarnings(ethers.formatEther(earnings));
    }
  }, [llmEntries, userAddress]);
  
  // Count hosted models owned by the user
  const ownedModels = llmEntries.filter(llm => 
    userAddress && (
      userAddress.toLowerCase() === llm.owner1.toLowerCase() || 
      userAddress.toLowerCase() === llm.owner2.toLowerCase()
    )
  ).length;
  
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
              <p className="text-xs text-gray-700">Total LLMs you're hosting</p>
            </div>
            <div className="text-xl font-bold text-black">{ownedModels}</div>
          </div>
          
          {/* Earnings */}
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-black">Total Earnings</h3>
              <p className="text-xs text-gray-700">Your share from pools</p>
            </div>
            <div className="text-xl font-bold text-black">{totalEarnings} ETH</div>
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