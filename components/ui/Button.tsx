"use client";

import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary: "bg-court-500 text-white hover:bg-court-400",
  secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost: "text-white/70 hover:text-white hover:bg-white/5",
  danger: "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
