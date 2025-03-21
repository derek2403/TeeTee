import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useState } from "react";
import Link from 'next/link';

export default function Header() {
  const [selected, setSelected] = useState("api");

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center py-6">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold cursor-pointer">TeeTee</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/APIAccess">
            <span className="font-medium cursor-pointer hover:text-blue-600 transition-colors">API Key Access</span>
          </Link>
          <Link href="/ContributionPool">
            <span className="font-medium cursor-pointer hover:text-blue-600 transition-colors">Contribution Pool</span>
          </Link>
        </div>
        
        <div>
          <ConnectButton />
        </div>
      </div>
      
    
    </div>
  );
} 