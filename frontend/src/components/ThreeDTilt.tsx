import React, { useRef } from 'react';

interface ThreeDTiltProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function ThreeDTilt({ children, className = '', onClick }: ThreeDTiltProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // Cursor position relative to element
    const y = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    // Calculate rotation angles based on cursor offset from center
    // Coordinates go from -0.5 to 0.5
    const relativeX = (x / width) - 0.5;
    const relativeY = (y / height) - 0.5;

    const maxRotation = 2.5; // Decreased from 12 for an extremely subtle tilt
    const rotateY = relativeX * maxRotation;
    const rotateX = -relativeY * maxRotation;

    // Apply inline style with GPU acceleration
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    // Reset to initial values smoothly
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={cardRef}
      className={`three-d-tilt-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
}
