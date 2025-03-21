import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import Header from "../components/Header";

export default function APIAccess() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      
      <div className="max-w-4xl mx-auto my-12">
        <h1 className="text-3xl font-bold mb-6">API Key Access</h1>
        
        <Card shadow="sm" className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">Get Started with TeeTee API</h2>
          </CardHeader>
          <CardBody>
            <p className="mb-6">
              Get immediate access to our hosted shared TEEs by subscribing with an API key.
              Perfect for teams that need reliable, secure AI inference without managing infrastructure.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-md border mb-6">
              <h3 className="font-medium mb-2">Benefits of API Access</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Immediate access to secure AI inference</li>
                <li>No infrastructure management required</li>
                <li>Scalable resources based on your needs</li>
                <li>Pay only for what you use</li>
              </ul>
            </div>
            
            <Button color="primary" radius="sm" size="lg">Subscribe for API Key</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 