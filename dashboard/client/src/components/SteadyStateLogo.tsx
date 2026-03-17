export function SteadyStateLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SteadyState logo"
    >
      {/* Shield shape with stylized S */}
      <path
        d="M16 2L4 7v9c0 7.18 5.12 13.88 12 15.5C22.88 29.88 28 23.18 28 16V7L16 2z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M16 2L4 7v9c0 7.18 5.12 13.88 12 15.5C22.88 29.88 28 23.18 28 16V7L16 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Stylized S inside shield */}
      <path
        d="M19.5 11.5c0-1.66-1.34-3-3-3h-2c-1.66 0-3 1.34-3 3 0 1.66 1.34 3 3 3h2c1.66 0 3 1.34 3 3 0 1.66-1.34 3-3 3h-2c-1.66 0-3-1.34-3-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
