import React, { useState, useRef, useEffect } from "react"
import {
  Send,
  Building,
  Bed,
  Bath,
  AlertCircle,
  MapPin,
  Eye,
} from "lucide-react"
import { PropertyMap } from "./components/MapContainer"
import { PropertyDetailModal } from "./components/PropertyDetailModal"
import type { ChatMessage, Property } from "./types"

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am your real estate assistant. What is your budget and location preference?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeProperties, setActiveProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  )

  // State for property full details preview modal
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("https://alty-thesis.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      })

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: data.reply,
        status: data.status,
        recommendations: data.recommendations || [],
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (data.recommendations && data.recommendations.length > 0) {
        setActiveProperties(data.recommendations)
        setSelectedProperty(data.recommendations[0])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: "Connection error. Please ensure the backend server is running.",
          status: "rejected",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Full Details Modal */}
      <PropertyDetailModal
        property={previewProperty}
        onClose={() => setPreviewProperty(null)}
      />

      {/* Sidebar - Chat Container */}
      <div className="flex w-full flex-col border-r bg-white shadow-sm md:w-[480px]">
        <header className="flex items-center space-x-2 border-b bg-slate-900 p-4 text-white">
          <Building className="h-6 w-6 text-emerald-400" />
          <h1 className="text-lg font-semibold">Property Assistant</h1>
        </header>

        {/* Message Feed */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.sender === "user"
                    ? "rounded-br-none bg-slate-900 text-white"
                    : msg.status === "rejected"
                      ? "rounded-bl-none border border-red-200 bg-red-50 text-red-800"
                      : msg.status === "clarification_needed"
                        ? "rounded-bl-none border border-amber-200 bg-amber-50 text-amber-900"
                        : "rounded-bl-none bg-slate-100 text-slate-800"
                }`}
              >
                {msg.status === "clarification_needed" && (
                  <div className="mb-1 flex items-center space-x-1 font-medium text-amber-700">
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
                        setSelectedProperty(prop)
                        setPreviewProperty(prop) // Open modal on property click
                      }}
                      className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                        selectedProperty?.listing_id === prop.listing_id
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {prop.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewProperty(prop)
                          }}
                          className="ml-2 flex items-center rounded-md bg-emerald-100/60 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:underline"
                        >
                          <Eye className="mr-1 h-3 w-3" /> View
                        </button>
                      </div>

                      <div className="mt-1 flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          {prop.village_name}
                        </span>
                        <span className="flex items-center">
                          <Bed className="mr-1 h-3 w-3" />
                          {prop.num_bedrooms} Bed
                        </span>
                        <span className="flex items-center">
                          <Bath className="mr-1 h-3 w-3" />
                          {prop.num_bathrooms} Bath
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        ₱{prop.price_total.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="animate-pulse text-xs text-slate-400">
              Assistant is typing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form
          onSubmit={handleSendMessage}
          className="flex space-x-2 border-t bg-white p-3"
        >
          <input
            type="text"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
            placeholder="Ask about properties (e.g. 5M budget in subdivision)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Main Panel - Interactive Leaflet Navigation */}
      <div className="hidden flex-1 flex-col space-y-4 p-4 md:flex">
        <div className="relative flex-1 rounded-2xl border bg-white p-2 shadow-sm">
          <PropertyMap
            properties={activeProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop)
              setPreviewProperty(prop) // Open modal on map marker click
            }}
          />
        </div>
      </div>
    </div>
  )
}
