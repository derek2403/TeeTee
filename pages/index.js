import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("sk-tee-llm-123456789"); // Default API key
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Clear input and set loading state
    setInput("");
    setIsLoading(true);

    try {
      // Call our API endpoint
      const response = await fetch("/api/hello", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add AI response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: data.response }
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: `Error: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${geistSans.variable} ${geistMono.variable} font-sans`}>
      <Head>
        <title>TEE LLM Chat</title>
        <meta name="description" content="Chat with a TEE-secured LLM" />
      </Head>
      
      <header className="bg-black text-white p-4">
        <h1 className="text-xl font-bold">TEE-Secured LLM Chat</h1>
        <p className="text-sm opacity-75">Powered by layer-split Trusted Execution Environments</p>
      </header>
      
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col p-4">
        {/* API Key input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
            placeholder="Enter your API key"
          />
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 border border-gray-200 rounded-lg mb-4 overflow-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 ml-8"
                      : "bg-white border border-gray-200 mr-8"
                  }`}
                >
                  <div className="font-semibold text-xs text-gray-500 mb-1">
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="p-3 rounded-lg bg-white border border-gray-200 mr-8">
                  <div className="font-semibold text-xs text-gray-500 mb-1">
                    AI Assistant
                  </div>
                  <div className="animate-pulse">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows="3"
              className="w-full p-2 border border-gray-300 rounded resize-none"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-black text-white px-4 py-2 rounded-full h-10 flex items-center justify-center disabled:bg-gray-300"
          >
            {isLoading ? (
              <span className="animate-pulse">•••</span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </main>
      
      <footer className="bg-gray-100 border-t p-4 text-center text-sm text-gray-500">
        Secure LLM Processing with Trusted Execution Environments
      </footer>
    </div>
  );
}
