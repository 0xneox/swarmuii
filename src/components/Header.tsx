"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Menu, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ className, onMenuToggle }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex justify-between items-center h-[50px] sm:h-[60px] rounded-full border border-[#064C94] hover:shadow-sm transition-all z-50 duration-300 hover:-translate-y-0.5 hover:shadow-[#0874E3] mt-5",
        className
      )}
      style={{
        background: "linear-gradient(270deg, #0874E3 7.24%, #010405 57.23%)",
        width: "95%",
        maxWidth: "100%",
        margin: "35px auto -10px",
      }}
    >
      <div className="flex items-center gap-3 ml-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden text-white/70 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Link href="/">
          <h1 className="text-xl font-medium text-white">
            Swarm Node Rewards Hub
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-2 mr-8">
        <Button
          variant="outline"
          disabled={true}
          className="opacity-50 cursor-not-allowed bg-gray-600 text-gray-400 border-gray-600"
        >
          <User className="h-4 w-4 mr-2" />
          Auth Disabled
        </Button>
      </div>
    </header>
  );
}