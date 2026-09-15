"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm text-white/60"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/35 outline-none transition focus:border-court-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-court-400/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-red-500/50" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";
