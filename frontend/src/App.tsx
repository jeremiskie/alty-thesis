import React, { useState, useRef, useEffect } from "react"
import { PropertyMap } from "./components/MapContainer"
import { PropertyDetailModal } from "./components/PropertyDetailModal"
import { Header } from "./components/Header"
import { ChatMessageList } from "./components/ChatMessageList"
import { ChatInput } from "./components/ChatInput"
import type { ChatMessage, Property, LocationPoint } from "./types"

const BACKEND_URL = "https://alty-thesis.onrender.com"

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am your real estate assistant. What is your budget and location preference?",
    },
  ])
  const [input, setInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeProperties, setActiveProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  )
  const [workplaceLocation, setWorkplaceLocation] =
    useState<LocationPoint | null>(null)
  const [activeTab, setActiveTab] = useState<"chat" | "map">("chat")
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null)

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    fetch(`${BACKEND_URL}/properties`)
      .then((res) => res.json())
      .then(
        (data) =>
          Array.isArray(data) && data.length > 0 && setActiveProperties(data)
      )
      .catch((err) => console.error("Failed to load initial properties:", err))
  }, [])

  const sendChatMessage = async (textMessage: string) => {
    if (!textMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textMessage,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          workplace_lat: workplaceLocation?.lat || null,
          workplace_lng: workplaceLocation?.lng || null,
          workplace_name: workplaceLocation?.name || null,
        }),
      })

      const data = await response.json()
      if (data.detected_workplace) setWorkplaceLocation(data.detected_workplace)

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: data.reply,
          status: data.status,
          recommendations: data.recommendations || [],
        },
      ])

      if (data.recommendations?.length > 0)
        setActiveProperties(data.recommendations)
    } catch {
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    sendChatMessage(input)
    setInput("")
  }

  const handleSetWorkplaceClick = () => {
    const placeName = prompt(
      "Enter your workplace address or city (e.g., 'BGC Taguig'):"
    )
    if (placeName?.trim())
      sendChatMessage(`My workplace is at ${placeName.trim()}`)
  }

  const handleSelectProperty = (prop: Property) => {
    setSelectedProperty(prop)
    setPreviewProperty(prop)
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 font-sans md:flex-row">
      <PropertyDetailModal
        property={previewProperty}
        workplaceLocation={workplaceLocation}
        onSetWorkplaceClick={handleSetWorkplaceClick}
        onClose={() => setPreviewProperty(null)}
      />

      <div
        className={`flex h-full w-full flex-col border-r bg-white shadow-sm md:w-[420px] lg:w-[480px] ${activeTab === "chat" ? "flex" : "hidden md:flex"}`}
      >
        <Header
          workplaceLocation={workplaceLocation}
          activeTab={activeTab}
          activePropertiesCount={activeProperties.length}
          onSetWorkplaceClick={handleSetWorkplaceClick}
          onTabChange={setActiveTab}
        />
        <ChatMessageList
          messages={messages}
          selectedProperty={selectedProperty}
          isLoading={isLoading}
          chatEndRef={chatEndRef}
          onSelectProperty={handleSelectProperty}
        />
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={handleSendMessage}
        />
      </div>

      <div
        className={`h-full flex-1 flex-col p-2 sm:p-4 ${activeTab === "map" ? "flex" : "hidden md:flex"}`}
      >
        <div className="relative h-full w-full flex-1 rounded-xl border bg-white p-1 shadow-sm sm:rounded-2xl sm:p-2">
          <PropertyMap
            properties={activeProperties}
            selectedProperty={selectedProperty}
            workplaceLocation={workplaceLocation}
            onSelectProperty={handleSelectProperty}
            onClearNearby={() => setSelectedProperty(null)}
          />
        </div>
      </div>
    </div>
  )
}
