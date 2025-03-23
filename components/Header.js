import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';

export default function Header() {
  const { isConnected } = useAccount();

  return (
    <div className="w-full relative border-b border-gray-200">
      <div className="w-full max-w-6xl mx-auto relative">
        <div className="flex justify-between items-center py-6">
          <div className="w-1/5">
            <Link href="/">
              <div className="cursor-pointer">
                <Image 
                  src="/logo.png" 
                  alt="TeeTee Logo" 
                  width={100} 
                  height={40} 
                  priority
                />
              </div>
            </Link>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-8">
              <Link href="/AIChat">
                <span className="font-medium cursor-pointer hover:text-blue-600 transition-colors whitespace-nowrap">AI Chat</span>
              </Link>
              <Link href="/models">
                <span className="font-medium cursor-pointer hover:text-blue-600 transition-colors whitespace-nowrap">Models</span>
              </Link>
              <Link href="/ContributionPool">
                <span className="font-medium cursor-pointer hover:text-blue-600 transition-colors whitespace-nowrap">Contribution Pool</span>
              </Link>
            </div>
          </div>
          
          <div className={`flex ${isConnected ? 'min-w-fit -mr-16' : 'w-1/5'} justify-end`}>
            <ConnectButton />
          </div>
        </div>
      </div>
    </div>
  );
} 