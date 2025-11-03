import React from 'react';

export const LanguageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 21l5.25-11.25L21 21m-9-3.75h.008v.008H12v-.008zM3 16.5a.75.75 0 011.06-1.06l3.44 3.44-1.06 1.06a.75.75 0 01-1.06 0l-1.38-1.38a.75.75 0 010-1.06zM3 16.5l3.44 3.44"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
