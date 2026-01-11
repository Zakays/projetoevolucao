import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import ViceItem from '@/components/ViceItem';
import { Vice } from '@/types';
import { toast } from 'sonner';

export default function VicesPage() {
  const [vices, setVices] = useState<Vice[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#6b46c1');

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

          {vices.map(v => (
            <ViceItem key={v.id} vice={v} onDeleted={() => refresh()} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
