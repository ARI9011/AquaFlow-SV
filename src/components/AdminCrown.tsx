import { Crown } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

// Corona junto al nombre de cualquier usuario con rol "admin".
export default function AdminCrown({ size = 12, className = '' }: { size?: number; className?: string }) {
  const { t } = useLang();
  return (
    <Crown
      size={size}
      className={`text-amber-400 fill-amber-400/40 flex-shrink-0 ${className}`}
      aria-label={t('Administrador')}
    />
  );
}
