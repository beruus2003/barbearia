interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className = "", width = 150, height = 150 }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 150 150" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        <rect width="150" height="150" fill="#1e40af" rx="20"/>
        <circle cx="75" cy="60" r="25" fill="white"/>
        <rect x="50" y="85" width="50" height="4" fill="white" rx="2"/>
        <rect x="45" y="95" width="60" height="4" fill="white" rx="2"/>
        <rect x="55" y="105" width="40" height="4" fill="white" rx="2"/>
        <text 
          x="75" 
          y="130" 
          textAnchor="middle" 
          fill="white" 
          fontFamily="Arial, sans-serif" 
          fontSize="12" 
          fontWeight="bold"
        >
          BARBEARIA
        </text>
      </svg>
    </div>
  );
}