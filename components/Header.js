import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { useState } from "react";

export default function Header() {
  const [selected, setSelected] = useState("api");

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center py-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">TeeTee</h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Beta</span>
        </div>
        <ConnectButton />
      </div>
      
      <div className="my-8">
        <Card shadow="sm" className="w-full">
          <CardHeader className="flex gap-3">
            <div>
              <h2 className="text-2xl font-bold">Choose Your TEE Access Method</h2>
              <p className="text-gray-500">
                Select how you want to interact with our AI-driven infrastructure for distributed LLM inference.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex border-b mb-4">
              <button 
                className={`py-2 px-4 font-medium ${selected === "api" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                onClick={() => setSelected("api")}
              >
                API Key Access
              </button>
              <button 
                className={`py-2 px-4 font-medium ${selected === "contribute" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                onClick={() => setSelected("contribute")}
              >
                Contribution Pool
              </button>
            </div>

            {selected === "api" && (
              <div className="p-4 rounded-md border">
                <h3 className="text-xl font-semibold mb-2">Use API Key</h3>
                <p className="mb-4">
                  Get immediate access to our hosted shared TEEs by subscribing with an API key.
                  Perfect for teams that need reliable, secure AI inference without managing infrastructure.
                </p>
                <Button color="primary" radius="sm">Get API Key</Button>
              </div>
            )}

            {selected === "contribute" && (
              <div className="p-4 rounded-md border">
                <h3 className="text-xl font-semibold mb-2">Join Contribution Pool</h3>
                <p className="mb-4">
                  Contribute your own TEE resources to our network and get access to the entire distributed system.
                  Ideal for those who can provide computational resources and want to be part of the TEE network.
                </p>
                <Button color="secondary" radius="sm">Join Pool</Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 