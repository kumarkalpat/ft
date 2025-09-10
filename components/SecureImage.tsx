import React, { useState, useEffect } from 'react';

interface SecureImageProps {
  src?: string;
  alt: string;
  className?: string;
  name: string; // Used for fallback avatar
}

export const SecureImage: React.FC<SecureImageProps> = ({ src, alt, className, name }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&color=fff&size=128`;

  useEffect(() => {
    let isMounted = true;
    if (!src) {
      setImageUrl(fallbackUrl);
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error('Image fetch failed');
        }
        const blob = await response.blob();
        if (isMounted) {
          setImageUrl(URL.createObjectURL(blob));
        }
      } catch (error) {
        console.error('Failed to load image:', src, error);
        if (isMounted) {
          setImageUrl(fallbackUrl);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [src, name, fallbackUrl]);

  if (!imageUrl) {
    return <div className={`animate-pulse bg-slate-300 dark:bg-slate-700 ${className}`} />;
  }

  return <img src={imageUrl} alt={alt} className={className} referrerPolicy="no-referrer" />;
};
