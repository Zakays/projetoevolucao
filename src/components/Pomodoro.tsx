import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RefreshCcw, Settings } from 'lucide-react';
import { storage } from '@/lib/storage';

interface PomodoroProps {
  focusMinutes?: number;
  breakMinutes?: number;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const Pomodoro: React.FC<PomodoroProps> = ({ focusMinutes = 25, breakMinutes = 5 }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [remaining, setRemaining] = useState(focusMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [preset, setPreset] = useState('default');
  const [longBreakMinutes, setLongBreakMinutes] = useState(20);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    // update remaining if durations changed via props
    setRemaining(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
  }, [focusMinutes, breakMinutes, mode]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // watch remaining and switch modes / persist sessions deterministically
  useEffect(() => {
    if (!isRunning) return;

    if (remaining <= 1 && mode === 'focus') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      storage.addPomodoroSession({ focusTime: focusMinutes, breakTime: breakMinutes, sessionsCompleted: newCount, totalTime: focusMinutes });

      if (notificationsEnabled && typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification('Pomodoro', { body: 'Fim do foco — hora da pausa!' });
        } else {
          Notification.requestPermission();
        }
      }

      const useLong = newCount % cyclesBeforeLongBreak === 0;
      setMode('break');
      setRemaining((useLong ? longBreakMinutes : breakMinutes) * 60);
    } else if (remaining <= 1 && mode === 'break') {
      setMode('focus');
      setRemaining(focusMinutes * 60);
    }
  }, [remaining, isRunning, mode, sessionsCompleted, breakMinutes, focusMinutes, longBreakMinutes, cyclesBeforeLongBreak, notificationsEnabled]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setMode('focus');
    setRemaining(focusMinutes * 60);
    setSessionsCompleted(0);
  };

  const presets = [
    { key: 'default', label: 'Pomodoro 25/5', focus: 25, brk: 5 },
    { key: 'short', label: 'Curto 15/5', focus: 15, brk: 5 },
    { key: 'long', label: 'Longo 50/10', focus: 50, brk: 10 },
  ];

  const applyPreset = (key: string) => {
    const p = presets.find(x => x.key === key);
    if (!p) return;
    setPreset(key);
    setRemaining(p.focus * 60);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-red-500" />
          <span>Pomodoro</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-mono">{formatTime(remaining)}</div>
            <div className="text-sm text-muted-foreground">Modo: {mode === 'focus' ? 'Foco' : 'Pausa'}</div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <select aria-label="preset" value={preset} onChange={(e) => applyPreset(e.target.value)} className="input">
              {presets.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Long Break (min):</label>
              <input type="number" min={5} value={longBreakMinutes} onChange={(e) => setLongBreakMinutes(parseInt(e.target.value || '20'))} className="input w-24" />
              <label className="text-sm">Ciclos p/ Long Break:</label>
              <input type="number" min={1} value={cyclesBeforeLongBreak} onChange={(e) => setCyclesBeforeLongBreak(parseInt(e.target.value || '4'))} className="input w-20" />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Notificações:</label>
              <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} aria-label="enable-notifications" />
            </div>

            <div className="text-sm">Sessões concluídas: {sessionsCompleted}</div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-4">
            {!isRunning ? (
              <Button onClick={start} className="flex items-center">
                <Play className="h-4 w-4 mr-2" /> Iniciar
              </Button>
            ) : (
              <Button onClick={pause} className="flex items-center">
                <Pause className="h-4 w-4 mr-2" /> Pausar
              </Button>
            )}
            <Button variant="outline" onClick={reset} className="flex items-center">
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Pomodoro;