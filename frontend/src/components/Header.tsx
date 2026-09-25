import React from "react"
import { Building, Navigation, MessageSquare, Map as MapIcon, X } from "lucide-react"
import type { HeaderProps } from "../types"

export const Header: React.FC<HeaderProps> = ({
  workplaceLocation,
  activeTab,
  activePropertiesCount,
  onSetWorkplaceClick,
  onClearWorkplace,
  onTabChange,
}) => {
  return (
    <div>
      {/* Mobile/Tablet Header & Tab Navigation */}
      <div className="flex flex-col border-b bg-slate-900 text-white md:hidden">
        <header className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <Building className="h-6 w-6 text-emerald-400" />
            <h1 className="text-base font-semibold">Property Assistant</h1>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onSetWorkplaceClick}
              className="flex items-center space-x-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-emerald-400"
            >
              <Navigation className="h-3 w-3" />
              <span>{workplaceLocation ? workplaceLocation.name : "Set Work"}</span>
            </button>
            {workplaceLocation && (
              <button
                onClick={onClearWorkplace}
                aria-label="Clear workplace"
                className="flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </header>

        <div className="flex border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={() => onTabChange("chat")}
            className={`flex flex-1 items-center justify-center space-x-2 py-2.5 text-xs font-semibold transition ${
              activeTab === "chat"
                ? "border-b-2 border-emerald-400 bg-slate-800 text-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat Assistant</span>
          </button>
          <button
            onClick={() => onTabChange("map")}
            className={`flex flex-1 items-center justify-center space-x-2 py-2.5 text-xs font-semibold transition ${
              activeTab === "map"
                ? "border-b-2 border-emerald-400 bg-slate-800 text-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MapIcon className="h-4 w-4" />
            <span>Interactive Map ({activePropertiesCount})</span>
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden items-center justify-between border-b bg-slate-900 p-4 text-white md:flex">
        <div className="flex items-center space-x-2">
          <Building className="h-6 w-6 text-emerald-400" />
          <h1 className="text-lg font-semibold">Property Assistant</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSetWorkplaceClick}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-slate-700"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">
              {workplaceLocation ? workplaceLocation.name : "Set Workplace"}
            </span>
          </button>
          {workplaceLocation && (
            <button
              onClick={onClearWorkplace}
              aria-label="Clear workplace"
              className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>
    </div>
  )
}