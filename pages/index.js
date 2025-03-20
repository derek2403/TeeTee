import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-center items-center h-full">
        <ConnectButton />
      </header>
    </div>
  );
}
