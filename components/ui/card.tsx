import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
}

export function Card({ children, className, title }: CardProps) {
    return (
        <div className={clsx("bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 transition-all hover:shadow-2xl", className)}>
            {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
            {children}
        </div>
    );
}
