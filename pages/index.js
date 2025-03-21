import Header from '../components/Header';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import LandingThreeModel from '../components/LandingThreeModel';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-10">
        <Header />
      </div>
      
      {/* 3D Visualization */}
      <div className="absolute top-0 left-0 w-full z-0">
        <LandingThreeModel />
      </div>
      
      {/* Headline Text */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center text-blue-900 z-10 px-4">
        <h1 className="text-4xl font-bold mb-2">LLM Sharing Across Multiple Verifiable TEE with Decentralized Inference</h1>
        <p className="text-xl opacity-80">Secure, Sharded AI Processing</p>
      </div>
      
      {/* Buttons directly below 3D visualization - moved lower */}
      <div className="absolute top-[80vh] left-1/2 transform -translate-x-1/2 text-center z-10">
        <div className="flex justify-center gap-4">
          <Link href="/learn-more">
            <Button color="primary" radius="sm" size="lg">Learn More</Button>
          </Link>
          <Link href="/documentation">
            <Button color="secondary" radius="sm" size="lg">View Documentation</Button>
          </Link>
        </div>
      </div>
      
      {/* Content below the 3D visualization - white cards with API Key Access and Contribution Pool */}
      <div className="absolute top-[90vh] left-0 w-full z-10 bg-white bg-opacity-95 pb-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card shadow="sm" className="bg-white">
              <CardHeader>
                <h2 className="text-2xl font-semibold">API Key Access</h2>
              </CardHeader>
              <CardBody>
                <p className="mb-6">
                  Get immediate access to our hosted shared TEEs by subscribing with an API key.
                  Perfect for teams that need reliable, secure AI inference.
                </p>
                <Link href="/api-access">
                  <Button color="primary" radius="sm">Get Started</Button>
                </Link>
              </CardBody>
            </Card>
            
            <Card shadow="sm" className="bg-white">
              <CardHeader>
                <h2 className="text-2xl font-semibold">Contribution Pool</h2>
              </CardHeader>
              <CardBody>
                <p className="mb-6">
                  Contribute your own TEE resources to our network and get access to the entire distributed system.
                  Join our decentralized AI infrastructure.
                </p>
                <Link href="/contribution-pool">
                  <Button color="secondary" radius="sm">Join Pool</Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
