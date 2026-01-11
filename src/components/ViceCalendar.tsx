import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { storage } from '@/lib/storage';
import { ViceCompletion } from '@/types';

interface Props {
  viceId: string;
}

export default function ViceCalendar({ viceId }: Props) {
  const [month, setMonth] = useState(() => new Date());
  const [cleanDates, setCleanDates] = useState<Date[]>([]);
  const [relapseDates, setRelapseDates] = useState<Date[]>([]);

  const loadMonth = (d: Date) => {
    const m = d.toISOString().slice(0,7); // YYYY-MM
    const map = storage.getViceCalendarData(viceId, m);
    const cleans: Date[] = [];
    const relapses: Date[] = [];
    for (const [k,v] of Object.entries(map)) {
      const dt = new Date(k + 'T00:00:00');
      if (v === 'clean') cleans.push(dt);
      if (v === 'relapse') relapses.push(dt);
    }
    setCleanDates(cleans);
    setRelapseDates(relapses);
  };

  useEffect(() => {
    loadMonth(month);
  }, [month]);

  const onDayClick = (day?: Date) => {
    if (!day) return;
    const dayStr = day.toISOString().slice(0,10);
    const map = storage.getViceCalendarData(viceId, dayStr.slice(0,7));
    const current = map[dayStr];
    if (!current) {
      storage.toggleViceDay(viceId, 'clean', dayStr);
    } else if (current === 'clean') {
      storage.toggleViceDay(viceId, 'relapse', dayStr);
    } else {
      // relapse -> remove
      storage.toggleViceDay(viceId, 'relapse', dayStr); // toggle will remove if same
    }
    // reload
    loadMonth(month);
  };

  return (
    <div>
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        showOutsideDays
        selected={undefined}
        onSelect={onDayClick}
        modifiers={{ clean: cleanDates, relapse: relapseDates }}
        modifiersClassNames={{ clean: 'vice-day-clean', relapse: 'vice-day-relapse' }}
      />

      <div className={'vices-legend mt-2'}>
        <div className={'swatch clean'} /> <div>Concluído (sem vício)</div>
        <div className={'swatch relapse ml-4'} /> <div>Relapso (cometi)</div>
      </div>
    </div>
  );
}
