import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import LandingThreeModel from '../components/LandingThreeModel';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative">
      {/* Main content area with light blue background */}
      <div className="absolute top-0 left-0 w-full h-full bg-blue-50">
        {/* 3D Visualization */}
        <div className="absolute top-0 left-0 w-full z-0 mt-10 overflow-hidden">
          <LandingThreeModel />
        </div>
        
        {/* Headline Text */}
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center text-blue-900 z-10 px-4 mt-5">
          <h1 className="text-4xl font-bold mb-2">LLM Sharing Across Multiple Verifiable TEE with Decentralized Inference</h1>
          <p className="text-xl opacity-80">Secure, Sharded and Low Cost LLM</p>
        </div>
        
      </div>
      
      
    </div>
  );
}
