import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gradient" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  suppressHydrationWarning,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0d14] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const variants = {
    primary:
      "bg-brand-600 hover:bg-brand-500 text-white focus:ring-brand-500 shadow-lg shadow-brand-600/25",
    secondary:
      "bg-surface text-slate-200 border border-surfaceBorder hover:bg-surfaceHover hover:border-slate-600 focus:ring-slate-400",
    gradient:
      "bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-violet hover:from-brand-500 hover:to-accent-violet/90 text-white font-semibold shadow-lg shadow-brand-600/30 border border-white/10",
    danger:
      "bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose border border-accent-rose/30 focus:ring-accent-rose",
    ghost:
      "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white focus:ring-slate-500",
    outline:
      "bg-transparent border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 focus:ring-brand-500",
  };

  return (
    <button
      suppressHydrationWarning={suppressHydrationWarning}
      className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
