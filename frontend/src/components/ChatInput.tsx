import React from "react"
import { Send } from "lucide-react"

interface ChatInputProps {
  input: string
  isLoading: boolean
  onInputChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="flex space-x-2 border-t bg-white p-2.5 sm:p-3"
    >
      <input
        type="text"
        className="flex-1 rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none sm:text-sm"
        placeholder="Ask about properties or work commute..."
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-slate-900 px-3.5 py-2 text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  )
}