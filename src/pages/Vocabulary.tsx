import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { VocabularyWord } from '@/types';
import { toast } from 'sonner';
import { playClick, playSuccess, playFail } from '@/lib/sound';

const VocabularyPage = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ word: '', definition: '', exampleSentence: '', category: '', difficulty: 'easy' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = () => setWords(storage.getVocabulary());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.definition.trim()) {
      toast.error('Palavra e definição são obrigatórias');
      return;
    }

    storage.addVocabularyWord({
      word: form.word.trim(),
      definition: form.definition.trim(),
      exampleSentence: form.exampleSentence.trim(),
      category: form.category.trim() || 'geral',
      difficulty: form.difficulty as any,
    });

    toast.success('Palavra adicionada');
    setIsDialogOpen(false);
    setForm({ word: '', definition: '', exampleSentence: '', category: '', difficulty: 'easy' });
    load();
  };

  const handleReview = (id: string, success = true) => {
    storage.markVocabularyReviewed(id, success);
    // sound feedback
    playClick();
    if (success) playSuccess(); else playFail();
    toast.success('Marcado como revisado');
    load();
  };

  const filtered = words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()) || w.definition.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className={'space-y-6'}>
        <div className={'flex items-center justify-between'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>Vocabulário</h1>
            <p className={'text-muted-foreground mt-1'}>Adicione, revise e organize palavras para estudar</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={'gradient-primary text-white border-0'}>
                Nova Palavra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Palavra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className={'space-y-4'}>
                <div className={'space-y-2'}>
                  <Label htmlFor={'word'}>Palavra</Label>
                  <Input id={'word'} value={form.word} onChange={(e) => setForm(prev => ({ ...prev, word: e.target.value }))} required />
                </div>

                <div className={'space-y-2'}>
                  <Label htmlFor={'definition'}>Definição</Label>
                  <Input id={'definition'} value={form.definition} onChange={(e) => setForm(prev => ({ ...prev, definition: e.target.value }))} required />
                </div>

                <div className={'space-y-2'}>
                  <Label htmlFor={'example'}>Exemplo</Label>
                  <Input id={'example'} value={form.exampleSentence} onChange={(e) => setForm(prev => ({ ...prev, exampleSentence: e.target.value }))} />
                </div>

                <div className={'grid grid-cols-2 gap-2'}>
                  <div className={'space-y-2'}>
                    <Label htmlFor={'category'}>Categoria</Label>
                    <Input id={'category'} value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} />
                  </div>
                  <div className={'space-y-2'}>
                    <Label htmlFor={'difficulty'}>Dificuldade</Label>
                    <select id={'difficulty'} className={'input w-full'} value={form.difficulty} onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))}>
                      <option value={'easy'}>Fácil</option>
                      <option value={'medium'}>Médio</option>
                      <option value={'hard'}>Difícil</option>
                    </select>
                  </div>
                </div>

                <div className={'flex justify-end space-x-2 pt-4'}>
                  <Button type={'button'} variant={'outline'} onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type={'submit'} className={'gradient-primary text-white border-0'}>Adicionar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent>
            <div className={'flex items-center space-x-2 mb-4'}>
              <Input placeholder={'Buscar palavra ou definição...'} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
              <div className={'text-center p-8 text-muted-foreground'}>Nenhuma palavra encontrada</div>
            ) : (
              <div className={'space-y-3'}>
                {filtered.map(w => (
                  <div key={w.id} className={'p-3 border rounded flex items-center justify-between'} data-testid={`vocab-row-${w.id}`}>
                    <div>
                      <div className={'font-semibold'}>{w.word} <span className={'text-xs text-muted-foreground ml-2'}>• {w.category} • {w.difficulty}</span></div>
                      <div className={'text-sm text-muted-foreground'}>{w.definition}</div>
                      {w.exampleSentence && <div className={'text-xs text-muted-foreground mt-1'}>Ex: {w.exampleSentence}</div>}
                    </div>

                    <div className={'flex flex-col items-end space-y-2'}>
                      <div className={'text-xs text-muted-foreground'}>Revisões: {w.reviewCount || 0}</div>
                      <div className={'text-xs text-muted-foreground'}>{w.lastReviewed || 'Nunca'}</div>
                      <div className={'text-xs text-muted-foreground'}>Próxima revisão: {w.nextReviewAt ? new Date(w.nextReviewAt).toISOString().split('T')[0] : 'Agora'}</div>
                      <div className={'flex space-x-2 mt-2'}>
                        <Button size={'sm'} variant={'outline'} onClick={() => handleReview(w.id, true)} data-testid={`review-success-${w.id}`}>Acertou</Button>
                        <Button size={'sm'} variant={'ghost'} onClick={() => handleReview(w.id, false)} data-testid={`review-fail-${w.id}`}>Errou</Button>
                      </div> 
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VocabularyPage;
