import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import ViceItem from '@/components/ViceItem';
import { Vice } from '@/types';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ViceCalendar from '@/components/ViceCalendar';

interface SortableViceItemProps {
  vice: Vice;
  onDeleted?: (id: string) => void;
}

const SortableViceItem = ({ vice, onDeleted }: SortableViceItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = () => {
    if (confirm(`Excluir vício "${vice.name}"?`)) {
      storage.deleteVice(vice.id);
      onDeleted?.(vice.id);
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className={'mb-3'}>
      <CardHeader>
        <CardTitle className={'flex items-center justify-between'}>
          <div className={'flex items-center space-x-3'}>
            {/* Handle para drag */}
            <div
              {...attributes}
              {...listeners}
              className={'cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded'}
            >
              <GripVertical className={'h-5 w-5 text-gray-400'} />
            </div>

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
};

export default function VicesPage() {
  const [vices, setVices] = useState<Vice[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#6b46c1');

  // Configuração do drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = vices.findIndex((vice) => vice.id === active.id);
      const newIndex = vices.findIndex((vice) => vice.id === over.id);

      const reorderedVices = arrayMove(vices, oldIndex, newIndex);

      // Atualizar a ordem no storage
      storage.updateVices(reorderedVices);
      setVices(reorderedVices);

      toast.success('Ordem dos vícios atualizada');
    }
  };

  useEffect(() => {
    setVices(storage.getVices());
  }, []);

  const refresh = () => setVices(storage.getVices());

  const addVice = () => {
    if (!name.trim()) return toast.error('Digite um nome para o vício');
    storage.addVice({ name: name.trim(), note: note.trim(), color });
    setName(''); setNote('');
    toast.success('Vício adicionado');
    refresh();
  };

  return (
    <Layout>
      <div className={'space-y-6'}>
        <div>
          <h1 className={'text-3xl font-bold'}>Destrua Vícios</h1>
          <p className={'text-muted-foreground mt-1'}>Crie um vício, registre dias sem o vício (limpos) ou dias de recaída.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar vício</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-2 items-end'}>
              <div className={'col-span-2'}>
                <label className={'text-sm'}>Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={'col-span-1'}>
                <label className={'text-sm'}>Cor</label>
                <input type={'color'} value={color} onChange={(e) => setColor(e.target.value)} className={'w-full h-10 p-0 border rounded-md'} />
              </div>
              <div className={'col-span-4 md:col-span-1'}>
                <label className={'text-sm'}>Nota (opcional)</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className={'col-span-4'}>
                <Button onClick={addVice} className={'mt-2'}>Adicionar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          {vices.length === 0 && (
            <div className={'text-muted-foreground'}>Nenhum vício adicionado ainda.</div>
          )}

          {vices.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={vices.map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                {vices.map(v => (
                  <SortableViceItem key={v.id} vice={v} onDeleted={() => refresh()} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </Layout>
  );
}
