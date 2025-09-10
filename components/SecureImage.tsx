import React, { useState, useEffect } from 'react';

interface SecureImageProps {
  src?: string;
  alt: string;
  className?: string;
  name: string; // Used for fallback avatar
}

export const SecureImage: React.FC<SecureImageProps> = ({ src, alt, className, name }) => {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  
  // Start with the intended src, or the fallback if no src is provided.
  const [currentSrc, setCurrentSrc] = useState(src || fallbackUrl);
  
  // useEffect to handle when the src prop changes dynamically.
  useEffect(() => {
    setCurrentSrc(src || fallbackUrl);
  }, [src, fallbackUrl]);

  const handleError = () => {
    // If an error occurs, and we aren't already showing the fallback, switch to it.
    if (currentSrc !== fallbackUrl) {
      console.error(`Failed to load primary image: ${src}. Falling back to avatar.`);
      setCurrentSrc(fallbackUrl);
    } else {
      // If the fallback itself fails, log it but do nothing to prevent loops.
      console.error(`Failed to load fallback avatar: ${fallbackUrl}`);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
};
