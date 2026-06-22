import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
    const base = "px-4 py-2 rounded-xl font-medium transition-all active:scale-95";
    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50",
        secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
        outline: "border border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900"
    };

    return (
        <button className={clsx(base, variants[variant], className)} {...props} />
    );
}
