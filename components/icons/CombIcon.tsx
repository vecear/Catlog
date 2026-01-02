import React from 'react';

export const CombIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className = "w-6 h-6", ...props }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Comb handle */}
        <rect x="3" y="4" width="18" height="4" rx="1" />
        {/* Comb teeth - evenly spaced (5 teeth from x=5 to x=19, spacing of 3.5) */}
        <line x1="5" y1="8" x2="5" y2="20" />
        <line x1="8.5" y1="8" x2="8.5" y2="20" />
        <line x1="12" y1="8" x2="12" y2="20" />
        <line x1="15.5" y1="8" x2="15.5" y2="20" />
        <line x1="19" y1="8" x2="19" y2="20" />
    </svg>
);
