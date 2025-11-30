import Image from 'next/image';

interface EmmaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
}

export function EmmaAvatar({ size = 'md', className = '', showStatus = false }: EmmaAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative rounded-full overflow-hidden border-2 border-white shadow-md ${sizeClasses[size]}`}>
        <Image
          src="/emma-avatar.jpg"
          alt="Emma Avatar"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      {showStatus && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
      )}
    </div>
  );
}
