import clsx from 'clsx';
import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
    uiSize?: 'default' | 'sm';
}

export function Select({ label, options, className, uiSize = 'default', ...props }: SelectProps) {
    return (
        <div className={clsx("flex flex-col", uiSize === 'sm' ? "gap-1" : "gap-1.5")}>
            {label && (
                <label className={clsx(
                    "font-semibold text-gray-500 ml-0.5",
                    uiSize === 'sm' ? "text-[11px] leading-none" : "text-sm"
                )}>
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={clsx(
                        "appearance-none w-full bg-white border border-gray-200 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors shadow-sm cursor-pointer",
                        uiSize === 'sm' ? "py-1.5 px-3 pr-7 text-xs rounded-lg" : "py-3 px-4 pr-8 rounded-xl",
                        className
                    )}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className={clsx("fill-current", uiSize === 'sm' ? "h-3.5 w-3.5" : "h-4 w-4")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

