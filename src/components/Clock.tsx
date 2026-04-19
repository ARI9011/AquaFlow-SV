import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const h12 = time.getHours() % 12 || 12;
    const m = String(time.getMinutes()).padStart(2, '0');
    const s = String(time.getSeconds()).padStart(2, '0');
    const ampm = time.getHours() >= 12 ? 'pm' : 'am';
    return `${String(h12).padStart(2, '0')}:${m}:${s} ${ampm}`;
  };

  return (
    <div className="text-right px-4">
      <p className="text-aqua-cyan font-mono text-xl font-bold tracking-tighter">
        {formatTime()}
      </p>
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">
        Soyapango, SV
      </p>
    </div>
  );
}