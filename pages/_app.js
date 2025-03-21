import "@/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  sepolia,
  polygonAmoy,
  optimismSepolia,
  arbitrumSepolia,
  baseSepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { HeroUIProvider } from '@heroui/react'
import Header from '../components/Header';

// Create a config with your desired chains and projectId
const config = getDefaultConfig({
  appName: 'My Web3 App',
  projectId: 'YOUR_PROJECT_ID', // Get a projectId at https://cloud.walletconnect.com
  chains: [sepolia, polygonAmoy, optimismSepolia, arbitrumSepolia, baseSepolia],
  ssr: true, // Enable server-side rendering
});

// Create a query client
const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <HeroUIProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Component {...pageProps} />
              </main>
            </div>
          </HeroUIProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
