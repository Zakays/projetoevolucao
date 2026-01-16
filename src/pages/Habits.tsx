import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { Habit, HabitCompletion } from '@/types';
import { toast } from 'sonner';
import { playClick, playSuccess } from '@/lib/sound';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Flame,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Star,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const CATEGORIES = [
  { value: 'saude', label: 'Saúde', color: 'bg-green-500' },
  { value: 'treino', label: 'Treino', color: 'bg-orange-500' },
  { value: 'estudo', label: 'Estudo', color: 'bg-blue-500' },
  { value: 'estetica', label: 'Estética', color: 'bg-pink-500' },
  { value: 'disciplina', label: 'Disciplina', color: 'bg-purple-500' },
];

interface HabitFormData {
  name: string;
  category: string;
  time: string;
  daysOfWeek: number[];
  isEssential: boolean;
  weight: 1 | 2 | 3;
  additionalInfo: string;
}

const defaultFormData: HabitFormData = {
  name: '',
  category: '',
  time: '',
  daysOfWeek: [],
  isEssential: false,
  weight: 1,
  additionalInfo: '',
};

interface SortableHabitItemProps {
  habit: Habit;
  categoryInfo: { label: string; color: string };
  completion: HabitCompletion | undefined;
  isCompleted: boolean;
  showCheckbox: boolean;
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  getDaysOfWeekText: (days: number[]) => string;
}

const SortableHabitItem = ({
  habit,
  categoryInfo,
  completion,
  isCompleted,
  showCheckbox,
  onToggle,
  onEdit,
  onDelete,
  getDaysOfWeekText
}: SortableHabitItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={'hover:shadow-md transition-shadow'}
    >
      <CardContent className={'p-6'}>
        <div className={'flex items-start justify-between'}>
          <div className={'flex items-start space-x-3 flex-1'}>
            {/* Checkbox apenas para hábitos de hoje */}
            {showCheckbox && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggle(habit.id)}
                className={'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 mt-1'}
              />
            )}

            <div className={'flex-1'}>
              <div className={'flex items-center space-x-3 mb-2'}>
                <h3 className={`text-lg font-semibold ${isCompleted && showCheckbox ? 'line-through text-muted-foreground' : ''}`}>
                  {habit.name}
                </h3>
                <Badge
                  variant={'outline'}
                  className={`${categoryInfo.color} text-white border-0`}
                >
                  {categoryInfo.label}
                </Badge>
                {habit.isEssential && (
                  <Badge variant={'destructive'} className={'text-xs'}>
                    <Star className={'h-3 w-3 mr-1'} />
                    Essencial
                  </Badge>
                )}
              </div>

              <div className={'grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground'}>
                <div className={'flex items-center space-x-2'}>
                  <Calendar className={'h-4 w-4'} />
                  <span>{getDaysOfWeekText(habit.daysOfWeek)}</span>
                </div>

                {habit.time && (
                  <div className={'flex items-center space-x-2'}>
                    <Clock className={'h-4 w-4'} />
                    <span>{habit.time}</span>
                  </div>
                )}

                <div className={'flex items-center space-x-2'}>
                  <Flame className={'h-4 w-4'} />
                  <span>{completion?.streak || 0} dias</span>
                </div>
              </div>

              {habit.additionalInfo && (
                <p className={'text-sm text-muted-foreground mt-2'}>
                  {habit.additionalInfo}
                </p>
              )}
            </div>
          </div>

          <div className={'flex items-center space-x-2 ml-4'}>
            {/* Handle para drag */}
            <div
              {...attributes}
              {...listeners}
              className={'cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded'}
            >
              <GripVertical className={'h-5 w-5 text-gray-400'} />
            </div>

            <Button
              variant={'ghost'}
              size={'sm'}
              onClick={() => onEdit(habit)}
              className={'text-blue-600 hover:text-blue-800 hover:bg-blue-50'}
            >
              <Edit className={'h-4 w-4'} />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={'ghost'}
                  size={'sm'}
                  className={'text-red-600 hover:text-red-800 hover:bg-red-50'}
                >
                  <Trash2 className={'h-4 w-4'} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Hábito</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o hábito "{habit.name}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(habit.id)}
                    className={'bg-red-600 hover:bg-red-700'}
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
};

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState<HabitFormData>(defaultFormData);
  const [selectedCategory, setSelectedCategory] = useState<string>('today');

  useEffect(() => {
    loadHabits();
    loadHabitCompletions();
  }, []);

  const loadHabits = () => {
    const allHabits = storage.getHabits();
    setHabits(allHabits);
  };

  const loadHabitCompletions = () => {
    const completions = storage.getHabitCompletions();
    setHabitCompletions(completions);
  };

  // Configuração do drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((habit) => habit.id === active.id);
      const newIndex = habits.findIndex((habit) => habit.id === over.id);

      const reorderedHabits = arrayMove(habits, oldIndex, newIndex);

      // Atualizar a ordem no storage
      storage.updateHabits(reorderedHabits);
      setHabits(reorderedHabits);

      toast.success('Ordem dos hábitos atualizada');
    }
  };

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do hábito é obrigatório');
      return;
    }
    
    if (!formData.category) {
      toast.error('Categoria é obrigatória');
      return;
    }
    
    if (formData.daysOfWeek.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    try {
      // Auth removed: allow local habit creation/editing
      if (editingHabit) {
        storage.updateHabit(editingHabit.id, {
          name: formData.name.trim(),
          category: formData.category as any,
          time: formData.time || undefined,
          daysOfWeek: formData.daysOfWeek,
          isEssential: formData.isEssential,
          weight: formData.weight,
          additionalInfo: formData.additionalInfo || undefined,
        });
        toast.success('Hábito atualizado com sucesso!');
      } else {
        storage.addHabit({
          name: formData.name.trim(),
          category: formData.category as any,
          time: formData.time || undefined,
          daysOfWeek: formData.daysOfWeek,
          isEssential: formData.isEssential,
          weight: formData.weight,
          additionalInfo: formData.additionalInfo || undefined,
        });
        toast.success('Hábito criado com sucesso!');
      }
      
      loadHabits();
      closeDialog();
    } catch (error) {
      toast.error('Erro ao salvar hábito');
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      category: habit.category,
      time: habit.time || '',
      daysOfWeek: habit.daysOfWeek,
      isEssential: habit.isEssential,
      weight: habit.weight,
      additionalInfo: habit.additionalInfo || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (habitId: string) => {
    // Auth removed: allow deletion locally
    storage.deleteHabit(habitId);
    toast.success('Hábito excluído com sucesso!');
    loadHabits();
  };

  const toggleHabit = async (habitId: string) => {
    // Auth removed: allow toggling locally
    const completion = habitCompletions.find(c => c.habitId === habitId);
    const newStatus = completion?.status === 'completed' ? 'not_completed' : 'completed';
    
    storage.completeHabit(habitId, newStatus);
    // play interactive sound feedback
    playClick();
    if (newStatus === 'completed') {
      playSuccess();
      toast.success('Hábito concluído! 🎉', {
        description: 'Parabéns por manter a consistência!'
      });
    }
    
    loadHabits();
    loadHabitCompletions();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingHabit(null);
    setFormData(defaultFormData);
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const getDaysOfWeekText = (daysOfWeek: number[]) => {
    if (daysOfWeek.length === 7) return 'Todos os dias';
    if (daysOfWeek.length === 0) return 'Nenhum dia';
    
    return daysOfWeek
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
      .join(', ');
  };

  const getHabitCompletion = (habitId: string) => {
    return habitCompletions.find(c => c.habitId === habitId);
  };

  // Filtrar hábitos baseado na categoria selecionada
  const getFilteredHabits = () => {
    if (selectedCategory === 'today') {
      return storage.getTodayHabits();
    } else if (selectedCategory === 'all') {
      return habits;
    } else {
      return habits.filter(habit => habit.category === selectedCategory);
    }
  };

  const filteredHabits = getFilteredHabits();

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Rastreamento de Hábitos
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Gerencie seus hábitos e construa uma rotina consistente
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={'gradient-primary text-white border-0'}>
                <Plus className={'h-4 w-4 mr-2'} />
                Novo Hábito
              </Button>
            </DialogTrigger>
            <DialogContent className={'max-w-2xl max-h-[90vh] overflow-y-auto'}>
              <DialogHeader>
                <DialogTitle>
                  {editingHabit ? 'Editar Hábito' : 'Criar Novo Hábito'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className={'space-y-6'}>
                {/* Nome */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'name'}>Nome do Hábito *</Label>
                  <Input
                    id={'name'}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={'Ex: Beber 2L de água'}
                    required
                  />
                </div>

                {/* Categoria */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'category'}>Categoria *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={'Selecione uma categoria'} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className={'flex items-center space-x-2'}>
                            <div className={`w-3 h-3 rounded-full ${category.color}`} />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horário */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'time'}>Horário (opcional)</Label>
                  <Input
                    id={'time'}
                    type={'time'}
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                {/* Dias da semana */}
                <div className={'space-y-2'}>
                  <Label>Dias da Semana *</Label>
                  <div className={'flex flex-wrap gap-2'}>
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type={'button'}
                        variant={formData.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                        size={'sm'}
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={'w-12'}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Peso e Essencial */}
                <div className={'grid grid-cols-2 gap-4'}>
                  <div className={'space-y-2'}>
                    <Label htmlFor={'weight'}>Peso (pontos)</Label>
                    <Select 
                      value={formData.weight.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, weight: parseInt(value) as 1 | 2 | 3 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'1'}>1 ponto (Fácil)</SelectItem>
                        <SelectItem value={'2'}>2 pontos (Médio)</SelectItem>
                        <SelectItem value={'3'}>3 pontos (Difícil)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className={'space-y-2'}>
                    <Label htmlFor={'essential'}>Hábito Essencial</Label>
                    <div className={'flex items-center space-x-2 h-10'}>
                      <Switch
                        id={'essential'}
                        checked={formData.isEssential}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEssential: checked }))}
                      />
                      <Label htmlFor={'essential'} className={'text-sm text-muted-foreground'}>
                        {formData.isEssential ? 'Sim' : 'Não'}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'additionalInfo'}>Informações Adicionais</Label>
                  <Textarea
                    id={'additionalInfo'}
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder={'Detalhes, lembretes ou observações sobre este hábito...'}
                    rows={3}
                  />
                </div>

                {/* Botões */}
                <div className={'flex justify-end space-x-2 pt-4'}>
                  <Button type={'button'} variant={'outline'} onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type={'submit'} className={'gradient-primary text-white border-0'}>
                    {editingHabit ? 'Atualizar' : 'Criar'} Hábito
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className={'p-4'}>
            <div className={'flex flex-wrap items-center gap-2'}>
              <Label className={'text-sm font-medium'}>Filtrar por:</Label>
              <Button
                variant={selectedCategory === 'today' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('today')}
              >
                <Calendar className={'h-4 w-4 mr-1'} />
                Hoje ({storage.getTodayHabits().length})
              </Button>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('all')}
              >
                Todos ({habits.length})
              </Button>
              {CATEGORIES.map((category) => {
                const count = habits.filter(h => h.category === category.value).length;
                return (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? 'default' : 'outline'}
                    size={'sm'}
                    onClick={() => setSelectedCategory(category.value)}
                    className={'space-x-1'}
                  >
                    <div className={`w-2 h-2 rounded-full ${category.color}`} />
                    <span>{category.label} ({count})</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Habits List */}
        <div className={'grid gap-4'}>
          {filteredHabits.length === 0 ? (
            <Card>
              <CardContent className={'p-8 text-center'}>
                <Circle className={'h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50'} />
                <h3 className={'text-lg font-medium mb-2'}>Nenhum hábito encontrado</h3>
                <p className={'text-muted-foreground mb-4'}>
                  {selectedCategory === 'today' 
                    ? 'Nenhum hábito configurado para hoje. Crie hábitos e configure os dias da semana.'
                    : selectedCategory === 'all'
                    ? 'Comece criando seu primeiro hábito para começar sua jornada de evolução!'
                    : `Nenhum hábito na categoria ${getCategoryInfo(selectedCategory).label}.`
                  }
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className={'gradient-primary text-white border-0'}
                >
                  <Plus className={'h-4 w-4 mr-2'} />
                  Criar Primeiro Hábito
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredHabits.map(h => h.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredHabits.map((habit) => {
                  const categoryInfo = getCategoryInfo(habit.category);
                  const completion = getHabitCompletion(habit.id);
                  const isCompleted = completion?.status === 'completed';
                  const showCheckbox = selectedCategory === 'today' || storage.getTodayHabits().some(h => h.id === habit.id);

                  return (
                    <SortableHabitItem
                      key={habit.id}
                      habit={habit}
                      categoryInfo={categoryInfo}
                      completion={completion}
                      isCompleted={isCompleted}
                      showCheckbox={showCheckbox}
                      onToggle={toggleHabit}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getDaysOfWeekText={getDaysOfWeekText}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Habits;