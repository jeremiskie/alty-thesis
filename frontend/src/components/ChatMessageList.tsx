import React from "react"
import { AlertCircle, Eye, MapPin, Bed, Bath } from "lucide-react"
import type { ChatMessage, Property } from "../types"

interface ChatMessageListProps {
  messages: ChatMessage[]
  selectedProperty: Property | null
  isLoading: boolean
  chatEndRef: React.RefObject<HTMLDivElement | null>
  onSelectProperty: (prop: Property) => void
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  selectedProperty,
  isLoading,
  chatEndRef,
  onSelectProperty,
}) => {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col ${
            msg.sender === "user" ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs shadow-sm sm:text-sm ${
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
                  onClick={() => onSelectProperty(prop)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                    selectedProperty?.listing_id === prop.listing_id
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs leading-snug font-semibold text-slate-900 sm:text-sm">
                      {prop.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectProperty(prop)
                      }}
                      className="ml-2 flex shrink-0 items-center rounded-md bg-emerald-100/60 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:underline"
                    >
                      <Eye className="mr-1 h-3 w-3" /> View
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3 text-slate-400" />
                      {prop.village_name}
                    </span>
                    <span className="flex items-center">
                      <Bed className="mr-1 h-3 w-3 text-slate-400" />
                      {prop.num_bedrooms} Bed
                    </span>
                    <span className="flex items-center">
                      <Bath className="mr-1 h-3 w-3 text-slate-400" />
                      {prop.num_bathrooms} Bath
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-700">
                      ₱{prop.price_total.toLocaleString()}
                    </p>
                    {prop.commute_info && (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        ⏱️ {prop.commute_info.duration_mins} mins away
                      </span>
                    )}
                  </div>
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
  )
}