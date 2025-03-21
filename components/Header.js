import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Header() {
  const { isConnected } = useAccount();

  return (
    <div className="w-full relative border-b border-gray-200">
      <div className="w-full max-w-6xl mx-auto relative">
        <div className="flex justify-between items-center py-6">
          <div className="w-1/5">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer">TeeTee</h1>
            </Link>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-8">
              <Link href="/APIAccess">
                <span className="font-medium cursor-pointer hover:text-blue-600 transition-colors whitespace-nowrap">API Key Access</span>
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