import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { JournalEntry } from '@/types';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Search,
  Calendar,
  Heart,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  TrendingUp
} from 'lucide-react';

interface JournalFormData {
  whatWentWell: string;
  whatToImprove: string;
  howIFelt: string;
  mood: number;
}

const defaultFormData: JournalFormData = {
  whatWentWell: '',
  whatToImprove: '',
  howIFelt: '',
  mood: 5,
};

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalFormData>(defaultFormData);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadEntries();
    setSelectedDate(today);
  }, []);

  const loadEntries = () => {
    const loaded = storage.getJournalEntries();
    setEntries(loaded || []);
  };

  const saveEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    storage.addJournalEntry(entry);
    loadEntries();
  };

  const updateEntry = (id: string, entry: Partial<JournalEntry>) => {
    const updated = storage.updateJournalEntry(id, entry);
    if (updated) {
      loadEntries();
    }
  };

  const deleteEntry = (id: string) => {
    const deleted = storage.deleteJournalEntry(id);
    if (deleted) {
      loadEntries();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.whatWentWell.trim() && !formData.whatToImprove.trim() && !formData.howIFelt.trim()) {
      toast.error('Preencha pelo menos um campo de reflexao');
      return;
    }

    try {
      const entryData = {
        date: selectedDate,
        whatWentWell: formData.whatWentWell.trim(),
        whatToImprove: formData.whatToImprove.trim(),
        howIFelt: formData.howIFelt.trim(),
        mood: formData.mood,
      };

      if (editingEntry) {
        updateEntry(editingEntry.id, entryData);
        toast.success('Reflexao atualizada com sucesso!');
      } else {
        saveEntry(entryData);
        toast.success('Reflexao registrada com sucesso!');
      }
      
      closeDialog();
    } catch (error) {
      toast.error('Erro ao salvar reflexao');
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      whatWentWell: entry.whatWentWell,
      whatToImprove: entry.whatToImprove,
      howIFelt: entry.howIFelt,
      mood: entry.mood,
    });
    setSelectedDate(entry.date);
    setIsDialogOpen(true);
  };

  const handleDelete = (entryId: string) => {
    deleteEntry(entryId);
    toast.success('Reflexao excluida com sucesso!');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    setFormData(defaultFormData);
    setSelectedDate(today);
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 8) return { icon: Smile, color: 'text-green-500', label: 'Muito bem' };
    if (mood >= 6) return { icon: ThumbsUp, color: 'text-blue-500', label: 'Bem' };
    if (mood >= 4) return { icon: Meh, color: 'text-yellow-500', label: 'Regular' };
    return { icon: Frown, color: 'text-red-500', label: 'Mal' };
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'bg-green-500';
    if (mood >= 6) return 'bg-blue-500';
    if (mood >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.whatWentWell.toLowerCase().includes(searchLower) ||
      entry.whatToImprove.toLowerCase().includes(searchLower) ||
      entry.howIFelt.toLowerCase().includes(searchLower)
    );
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = entries.find(e => e.date === today);
  const averageMood = entries.length > 0 
    ? Math.round(entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length * 10) / 10
    : 0;

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Diario & Reflexao
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Registre suas reflexoes e acompanhe seu crescimento pessoal
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={'gradient-primary text-white border-0'}>
                <Plus className={'h-4 w-4 mr-2'} />
                Nova Reflexao
              </Button>
            </DialogTrigger>
            <DialogContent className={'max-w-2xl max-h-[90vh] overflow-y-auto'}>
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Editar Reflexao' : 'Nova Reflexao'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className={'space-y-6'}>
                {/* Data */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'date'}>Data</Label>
                  <Input
                    id={'date'}
                    type={'date'}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                {/* O que foi bem */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'whatWentWell'}>O que fiz bem hoje?</Label>
                  <Textarea
                    id={'whatWentWell'}
                    value={formData.whatWentWell}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatWentWell: e.target.value }))}
                    placeholder={'Conquistas, momentos positivos, habitos cumpridos...'}
                    rows={4}
                  />
                </div>

                {/* O que melhorar */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'whatToImprove'}>O que posso melhorar amanha?</Label>
                  <Textarea
                    id={'whatToImprove'}
                    value={formData.whatToImprove}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatToImprove: e.target.value }))}
                    placeholder={'Areas de melhoria, habitos a focar, objetivos...'}
                    rows={4}
                  />
                </div>

                {/* Como se sentiu */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'howIFelt'}>Como me senti hoje?</Label>
                  <Textarea
                    id={'howIFelt'}
                    value={formData.howIFelt}
                    onChange={(e) => setFormData(prev => ({ ...prev, howIFelt: e.target.value }))}
                    placeholder={'Emocoes, sentimentos, reflexoes sobre o dia...'}
                    rows={4}
                  />
                </div>

                {/* Humor */}
                <div className={'space-y-4'}>
                  <div className={'flex items-center justify-between'}>
                    <Label className={'flex items-center space-x-2'}>
                      <Heart className={'h-4 w-4'} />
                      <span>Humor Geral (1-10)</span>
                    </Label>
                    <div className={'flex items-center space-x-2'}>
                      <span className={'text-sm font-medium'}>{formData.mood}</span>
                      {(() => {
                        const moodInfo = getMoodIcon(formData.mood);
                        const MoodIcon = moodInfo.icon;
                        return <MoodIcon className={`h-4 w-4 ${moodInfo.color}`} />;
                      })()}
                    </div>
                  </div>
                  <Slider
                    value={[formData.mood]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className={'w-full'}
                  />
                  <div className={'flex justify-between text-xs text-muted-foreground'}>
                    <span>Muito mal</span>
                    <span>Regular</span>
                    <span>Muito bem</span>
                  </div>
                </div>

                {/* Botoes */}
                <div className={'flex justify-end space-x-2 pt-4'}>
                  <Button type={'button'} variant={'outline'} onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type={'submit'} className={'gradient-primary text-white border-0'}>
                    {editingEntry ? 'Atualizar' : 'Registrar'} Reflexao
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Total de Reflexoes</CardTitle>
              <BookOpen className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{entries.length}</div>
              <p className={'text-xs text-muted-foreground'}>
                Registros de crescimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Humor Medio</CardTitle>
              <Heart className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{averageMood}/10</div>
              <p className={'text-xs text-muted-foreground'}>
                {averageMood >= 7 ? 'Muito positivo' : averageMood >= 5 ? 'Equilibrado' : 'Precisa atencao'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Reflexao Hoje</CardTitle>
              <Calendar className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>
                {todayEntry ? 'Feita' : 'Pendente'}
              </div>
              <p className={'text-xs text-muted-foreground'}>
                {todayEntry ? 'Parabens pela consistencia!' : 'Reserve um tempo para refletir'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className={'p-4'}>
            <div className={'flex items-center space-x-2'}>
              <Search className={'h-4 w-4 text-muted-foreground'} />
              <Input
                placeholder={'Buscar nas reflexoes...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={'flex-1'}
              />
              {searchTerm && (
                <Button
                  variant={'outline'}
                  size={'sm'}
                  onClick={() => setSearchTerm('')}
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Entries */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <BookOpen className={'h-5 w-5'} />
              <span>Reflexoes</span>
              <Badge variant={'outline'}>{filteredEntries.length}</Badge>
              {searchTerm && (
                <Badge variant={'secondary'}>
                  Filtrado: {filteredEntries.length} de {entries.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedEntries.length === 0 ? (
              <div className={'text-center py-8 text-muted-foreground'}>
                <BookOpen className={'h-12 w-12 mx-auto mb-4 opacity-50'} />
                <p>
                  {searchTerm 
                    ? 'Nenhuma reflexao encontrada com esses termos.' 
                    : 'Nenhuma reflexao registrada ainda.'
                  }
                </p>
                <p className={'text-sm'}>
                  {searchTerm 
                    ? 'Tente outros termos de busca.' 
                    : 'Comece registrando sua primeira reflexao!'
                  }
                </p>
              </div>
            ) : (
              <div className={'space-y-4'}>
                {sortedEntries.map((entry) => {
                  const moodInfo = getMoodIcon(entry.mood);
                  const MoodIcon = moodInfo.icon;
                  
                  return (
                    <Card key={entry.id} className={'hover:shadow-md transition-shadow'}>
                      <CardContent className={'p-4'}>
                        <div className={'flex items-start justify-between'}>
                          <div className={'flex-1'}>
                            <div className={'flex items-center space-x-3 mb-3'}>
                              <h3 className={'font-semibold'}>
                                {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </h3>
                              <div className={'flex items-center space-x-2'}>
                                <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood)}`} />
                                <span className={'text-sm text-muted-foreground'}>
                                  Humor: {entry.mood}/10
                                </span>
                                <MoodIcon className={`h-4 w-4 ${moodInfo.color}`} />
                              </div>
                            </div>
                            
                            <div className={'space-y-3'}>
                              {entry.whatWentWell && (
                                <div>
                                  <p className={'text-sm font-medium text-green-600 mb-1'}>
                                    ✅ O que foi bem:
                                  </p>
                                  <p className={'text-sm text-muted-foreground pl-4'}>
                                    {entry.whatWentWell}
                                  </p>
                                </div>
                              )}
                              
                              {entry.whatToImprove && (
                                <div>
                                  <p className={'text-sm font-medium text-blue-600 mb-1'}>
                                    🎯 Para melhorar:
                                  </p>
                                  <p className={'text-sm text-muted-foreground pl-4'}>
                                    {entry.whatToImprove}
                                  </p>
                                </div>
                              )}
                              
                              {entry.howIFelt && (
                                <div>
                                  <p className={'text-sm font-medium text-purple-600 mb-1'}>
                                    💭 Como me senti:
                                  </p>
                                  <p className={'text-sm text-muted-foreground pl-4'}>
                                    {entry.howIFelt}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className={'mt-3 text-xs text-muted-foreground'}>
                              Criado em: {new Date(entry.createdAt).toLocaleString('pt-BR')}
                              {entry.updatedAt !== entry.createdAt && (
                                <span> • Editado em: {new Date(entry.updatedAt).toLocaleString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className={'flex items-center space-x-2 ml-4'}>
                            <Button
                              variant={'outline'}
                              size={'icon'}
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className={'h-4 w-4'} />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant={'outline'} size={'icon'} className={'text-destructive hover:text-destructive'}>
                                  <Trash2 className={'h-4 w-4'} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Reflexao</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta reflexao? 
                                    Esta acao nao pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(entry.id)}
                                    className={'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Journal;