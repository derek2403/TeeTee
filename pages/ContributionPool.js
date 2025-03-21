import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import Header from "../components/Header";

export default function ContributionPool() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      
      <div className="max-w-4xl mx-auto my-12">
        <h1 className="text-3xl font-bold mb-6">Contribution Pool</h1>
        
        <Card shadow="sm" className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">Join the TeeTee Contribution Network</h2>
          </CardHeader>
          <CardBody>
            <p className="mb-6">
              Contribute your own TEE resources to our network and get access to the entire distributed system.
              Ideal for those who can provide computational resources and want to be part of the TEE network.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-md border mb-6">
              <h3 className="font-medium mb-2">Benefits of Contributing</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Earn tokens based on your contribution</li>
                <li>Access to the entire distributed network</li>
                <li>Participate in network governance</li>
                <li>Help build a decentralized AI infrastructure</li>
              </ul>
            </div>
            
            <Button color="secondary" radius="sm" size="lg">Connect and Contribute</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 