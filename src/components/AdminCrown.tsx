import { Crown } from 'lucide-react';

// Corona junto al nombre de cualquier usuario con rol "admin".
export default function AdminCrown({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <Crown
      size={size}
      className={`text-amber-400 fill-amber-400/40 flex-shrink-0 ${className}`}
      aria-label="Administrador"
    />
  );
}
