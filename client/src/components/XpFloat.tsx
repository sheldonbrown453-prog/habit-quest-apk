import { useEffect, useState } from "react";

interface XpFloatProps {
  amount: number;
  onDone?: () => void;
}

export function XpFloat({ amount, onDone }: XpFloatProps) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1300);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center">
      <div className="animate-xp-float flex items-center gap-1 bg-accent/90 text-accent-foreground font-bold text-xl px-4 py-2 rounded-full shadow-lg shadow-accent/30">
        <span>+{amount}</span>
        <span className="text-base">XP</span>
      </div>
    </div>
  );
}

interface LevelUpOverlayProps {
  level: number;
  tier: string;
  tierIcon: string;
  onDone?: () => void;
}

export function LevelUpOverlay({ level, tier, tierIcon, onDone }: LevelUpOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-bounce-in">
        {/* Burst rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full border-2 border-primary/40 animate-ping" />
          <div className="absolute w-32 h-32 rounded-full border-2 border-accent/40 animate-ping [animation-delay:150ms]" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <span className="text-4xl">{tierIcon}</span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-accent font-display text-sm tracking-[0.3em] uppercase">Level Up!</p>
          <p className="font-display text-5xl font-bold text-foreground">
            Level {level}
          </p>
          <p className="text-primary font-semibold text-lg">{tier}</p>
        </div>

        <button
          onClick={() => { setVisible(false); onDone?.(); }}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Tap to continue
        </button>
      </div>
    </div>
  );
}
