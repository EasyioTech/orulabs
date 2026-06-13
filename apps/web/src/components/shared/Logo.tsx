import React from "react";
import { cn } from "@oruclass/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      <path d="M3 7C3 4.79086 4.79086 3 7 3H12V12H3V7Z" fill="#EA4335" />
      <path d="M12 3H17C19.2091 3 21 4.79086 21 7V12H12V3Z" fill="#FBBC05" />
      <path d="M3 12H12V21H7C4.79086 21 3 19.2091 3 17V12Z" fill="#4285F4" />
      <path d="M12 12H21V17C21 19.2091 19.2091 21 17 21H12V12Z" fill="#34A853" />
      <circle cx="12" cy="12" r="3" fill="white" />
      <circle cx="12" cy="12" r="1.5" fill="#1a73e8" />
    </svg>
  );
}
