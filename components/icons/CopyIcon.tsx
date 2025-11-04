import React from 'react';

export const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        {...props}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V4.5m2.25 2.25h-1.5a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25h-1.5" />
    </svg>
);