import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-primary text-slate-900 hover:bg-primary/90": variant === "primary",
          "border border-primary bg-transparent text-primary hover:bg-primary/10":
            variant === "outline",
          "bg-transparent text-slate-600 hover:bg-slate-100": variant === "ghost",
          "bg-red-500 text-white hover:bg-red-600": variant === "danger",
        },
        {
          "px-3 py-1.5 text-xs": size === "sm",
          "px-4 py-2.5 text-sm": size === "md",
          "px-6 py-4 text-base": size === "lg",
        },
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
