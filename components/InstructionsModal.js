import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { CgCopy } from "react-icons/cg";
import { useRouter } from 'next/router';

export default function InstructionsModal({ isOpen, onClose, model }) {
  const router = useRouter();
  
  if (!model) return null;
  
  const isActive = model.numberOfNodes && model.hostAddresses && 
                   model.numberOfNodes === model.hostAddresses.length;

  // Format wallet address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const nodeJsExample = `import fetch from 'node-fetch';

async function generateText(prompt) {
  try {
    const response = await fetch("${model.nodeURL}/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        prompt: prompt 
      }),
    });

    const data = await response.json();
    return data.output;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
}

// Example usage
generateText("Write a short poem about AI")
  .then(result => console.log(result))
  .catch(err => console.error(err));`;

    const pythonExample = `import requests

def generate_text(prompt):
    url = "${model.nodeURL}/generate"
    headers = {"Content-Type": "application/json"}
    data = {"prompt": prompt}
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    return result["output"]

# Example usage
prompt = "Explain quantum computing in simple terms"
result = generate_text(prompt)
print(result)`;

  const proxyExample = `// Create a file pages/api/model-proxy.js:
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      "${model.nodeURL}/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error proxying request:", error);
    return res.status(500).json({ error: "Failed to fetch from endpoint" });
  }
}`;

  // Handle hosting this model
  const handleHostModel = () => {
    console.log("Redirecting to ContributionPool with model ID:", model.id);
    
    // Close the current modal first
    onClose();
    
    // Using window.location for a full page reload/redirect
    window.location.href = `/ContributionPool?model=${model.id}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onClose} 
      size="2xl"
      hideCloseButton={true}
      style={{ maxHeight: "80vh" }}
      className="overflow-auto"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">{model.name}</h3>
          <p className="text-sm text-gray-600">{model.description}</p>
        </ModalHeader>
        
        <ModalBody className="max-h-[calc(80vh-140px)] overflow-auto">
          {isActive ? (
            <div>
              <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <h4 className="font-medium text-green-800">Model is active and ready to use</h4>
                </div>
                <p className="text-sm text-green-700">
                  This model is being hosted by {model.hostAddresses.length} node(s) and is available for inference.
                </p>
                
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {model.hostAddresses.map((address, idx) => (
                    <div key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Node {idx+1}: {formatAddress(address)}
                    </div>
                  ))}
                </div>
              </div>
              
              <h4 className="font-semibold text-lg mb-2">Getting Started</h4>
              <p className="text-sm mb-4">
                Below are example code snippets for using this model. The model endpoint URL is:
              </p>
              <div className="bg-gray-100 p-2 rounded break-all mb-4 relative">
                <code className="text-sm">{model.nodeURL}</code>
                <button 
                  className="ml-2 text-gray-500 hover:text-gray-700" 
                  onClick={() => navigator.clipboard.writeText(model.nodeURL)}
                >
                  <CgCopy size={18} />
                </button>
              </div>
              
              <Tabs aria-label="Code examples" variant="underlined">
                <Tab key="javascript" title="JavaScript">
                  <div className="mt-4">
                    <h5 className="font-medium mt-4 mb-2">Node.js Example</h5>
                    <div className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto relative">
                      <pre className="text-sm whitespace-pre-wrap">{nodeJsExample}</pre>
                      <button 
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" 
                        onClick={() => navigator.clipboard.writeText(nodeJsExample)}
                        aria-label="Copy code"
                      >
                        <CgCopy size={18} />
                      </button>
                    </div>
                  </div>
                </Tab>
                
                <Tab key="python" title="Python">
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Python Requests Example</h5>
                    <div className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto relative">
                      <pre className="text-sm whitespace-pre-wrap">{pythonExample}</pre>
                      <button 
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" 
                        onClick={() => navigator.clipboard.writeText(pythonExample)}
                        aria-label="Copy code"
                      >
                        <CgCopy size={18} />
                      </button>
                    </div>
                  </div>
                </Tab>
                
                <Tab key="proxy" title="Next.js Proxy">
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Using a Server-Side Proxy</h5>
                    <p className="text-xs mb-2">
                      If you're making requests from a frontend application, you may want to use
                      a server-side proxy to avoid CORS issues.
                    </p>
                    <div className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto relative">
                      <pre className="text-sm whitespace-pre-wrap">{proxyExample}</pre>
                      <button 
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" 
                        onClick={() => navigator.clipboard.writeText(proxyExample)}
                        aria-label="Copy code"
                      >
                        <CgCopy size={18} />
                      </button>
                    </div>
                  </div>
                </Tab>
              </Tabs>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                <h5 className="font-medium mb-1">Model Information</h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Model URL: <a href={model.modelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{model.modelUrl}</a></li>
                  <li>Node URL: {model.nodeURL}</li>
                  <li>Number of Nodes: {model.numberOfNodes}</li>
                  <li>Active Nodes: {model.hostAddresses.length}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">Model Not Fully Active</h4>
              <p className="text-sm text-yellow-700 mb-3">
                This model requires {model.numberOfNodes} nodes to be fully active, but currently has only {model.hostAddresses.length} node(s) hosting it.
              </p>
              <p className="text-sm text-yellow-700 mb-4">
                You can contribute to hosting this model by providing a TEE node to power this model.
              </p>
              
              <Button 
                color="warning" 
                onClick={handleHostModel}
                className="w-full"
              >
                Host This Model
              </Button>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 