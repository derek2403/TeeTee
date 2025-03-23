import React from 'react';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

const Dashboard = ({ tokenBalance, aiChat, onClose }) => {
  return (
    <div className="space-y-4">
      {/* User Profile Section */}
      <Card shadow="sm">
        <CardHeader className="px-4 py-2">
          <h2 className="text-md font-semibold">User Profile</h2>
        </CardHeader>
        <CardBody className="px-4 py-2">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">User</h3>
              <p className="text-sm text-gray-500">user@example.com</p>
              <p className="text-sm text-gray-700">Token Balance: {tokenBalance}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Usage Stats */}
      <Card shadow="sm">
        <CardHeader className="px-4 py-2">
          <h2 className="text-md font-semibold">Usage Statistics</h2>
        </CardHeader>
        <CardBody className="px-4 py-2">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Messages Sent</p>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "65%" }}></div>
              </div>
              <p className="text-xs text-right mt-1">65%</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Token Usage</p>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "42%" }}></div>
              </div>
              <p className="text-xs text-right mt-1">42%</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Chat History Summary */}
      <Card shadow="sm">
        <CardHeader className="px-4 py-2">
          <h2 className="text-md font-semibold">Chat History</h2>
        </CardHeader>
        <CardBody className="px-4 py-2">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {aiChat.messages.length > 0 ? (
              aiChat.messages.map((message, index) => (
                <div key={index} className="flex items-start p-2 border-b last:border-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {message.role === 'user' ? 'U' : 'A'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{message.role} • {new Date().toLocaleTimeString()}</p>
                    <p className="text-sm truncate">{message.content.substring(0, 50)}...</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No chat history yet</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Settings */}
      <Card shadow="sm">
        <CardHeader className="px-4 py-2">
          <h2 className="text-md font-semibold">Settings</h2>
        </CardHeader>
        <CardBody className="px-4 py-2">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Dark Mode</span>
              <div className="w-10 h-5 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Notifications</span>
              <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Save Chat History</span>
              <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Buttons */}
      <div className="flex justify-between pt-2">
        <Button color="default" variant="bordered" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button color="primary" size="sm" onClick={() => aiChat.resetChat()}>
          Clear History
        </Button>
      </div>
    </div>
  );
};

export default Dashboard; 