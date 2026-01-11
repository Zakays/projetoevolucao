import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar as CalendarIcon } from 'lucide-react';
import ViceCalendar from './ViceCalendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Vice } from '@/types';
import { storage } from '@/lib/storage';

interface Props {
  vice: Vice;
  onDeleted?: (id: string) => void;
}

export default function ViceItem({ vice, onDeleted }: Props) {
  const handleDelete = () => {
    if (confirm(`Excluir vício "${vice.name}"?`)) {
      storage.deleteVice(vice.id);
      onDeleted?.(vice.id);
    }
  };

  return (
    <Card className={'mb-3'}>
      <CardHeader>
        <CardTitle className={'flex items-center justify-between'}>
          <div className={'flex items-center space-x-3'}>
            <div style={{ background: vice.color || 'var(--primary)' }} className={'w-8 h-8 rounded-md flex items-center justify-center text-white font-bold'}>
              {vice.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className={'font-medium'}>{vice.name}</div>
              {vice.note && <div className={'text-sm text-muted-foreground'}>{vice.note}</div>}
            </div>
          </div>

          <div className={'flex items-center space-x-2'}>
            <div className={'text-sm text-muted-foreground mr-2'}>Streak: <strong>{vice.streak || 0}</strong></div>

            <Dialog>
              <DialogTrigger asChild>
                <Button size={'sm'} variant={'ghost'}><CalendarIcon className={'h-4 w-4'} /> Ver calendário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Calendário — {vice.name}</DialogTitle>
                </DialogHeader>
                <div className={'mt-2'}>
                  <ViceCalendar viceId={vice.id} />
                </div>
              </DialogContent>
            </Dialog>

            <Button size={'sm'} variant={'ghost'} onClick={handleDelete}><Trash2 className={'h-4 w-4 text-destructive-foreground'} /></Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
      </CardContent>
    </Card>
  );
}
