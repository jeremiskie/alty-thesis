import React, { useState, useRef, useEffect } from 'react';
import { Send, Building, Bed, Bath, AlertCircle, MapPin, Eye } from 'lucide-react';
import { PropertyMap } from './components/MapContainer';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import type { ChatMessage, Property } from './types';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your real estate assistant. What is your budget and location preference?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProperties, setActiveProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // State for property full details preview modal
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply,
        status: data.status,
        recommendations: data.recommendations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.recommendations && data.recommendations.length > 0) {
        setActiveProperties(data.recommendations);
        setSelectedProperty(data.recommendations[0]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Connection error. Please ensure the backend server is running.',
          status: 'rejected',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Full Details Modal */}
      <PropertyDetailModal
        property={previewProperty}
        onClose={() => setPreviewProperty(null)}
      />

      {/* Sidebar - Chat Container */}
      <div className="w-full md:w-[480px] flex flex-col border-r bg-white shadow-sm">
        <header className="p-4 border-b flex items-center space-x-2 bg-slate-900 text-white">
          <Building className="h-6 w-6 text-emerald-400" />
          <h1 className="font-semibold text-lg">Property Assistant</h1>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : msg.status === 'rejected'
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-none'
                    : msg.status === 'clarification_needed'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}
              >
                {msg.status === 'clarification_needed' && (
                  <div className="flex items-center space-x-1 font-medium text-amber-700 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>More details needed</span>
                  </div>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>

              {/* Inline Property Suggestions */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 w-full space-y-2">
                  {msg.recommendations.map((prop) => (
                    <div
                      key={prop.listing_id}
                      onClick={() => {
                        setSelectedProperty(prop);
                        setPreviewProperty(prop); // Open modal on property click
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedProperty?.listing_id === prop.listing_id
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-slate-900">{prop.title}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewProperty(prop);
                          }}
                          className="text-xs flex items-center text-emerald-700 font-medium hover:underline bg-emerald-100/60 px-2 py-0.5 rounded-md ml-2"
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </button>
                      </div>

                      <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{prop.village_name}</span>
                        <span className="flex items-center"><Bed className="h-3 w-3 mr-1" />{prop.num_bedrooms} Bed</span>
                        <span className="flex items-center"><Bath className="h-3 w-3 mr-1" />{prop.num_bathrooms} Bath</span>
                      </div>
                      <p className="text-emerald-700 font-bold text-sm mt-2">
                        ₱{prop.price_total.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="text-xs text-slate-400 animate-pulse">Assistant is typing...</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex space-x-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="Ask about properties (e.g. 5M budget in subdivision)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Main Panel - Interactive Leaflet Navigation */}
      <div className="hidden md:flex flex-1 p-4 flex-col space-y-4">
        <div className="flex-1 bg-white p-2 rounded-2xl border shadow-sm relative">
          <PropertyMap
            properties={activeProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              setPreviewProperty(prop); // Open modal on map marker click
            }}
          />
        </div>
      </div>
    </div>
  );
}