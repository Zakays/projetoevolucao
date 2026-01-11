import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { WorkoutEntry, Exercise, Set } from '@/types';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Dumbbell, 
  Calendar,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Target,
  Activity
} from 'lucide-react';

interface WorkoutFormData {
  type: 'treino' | 'descanso' | 'recuperacao';
  exercises: Exercise[];
  notes: string;
  duration: number;
}

const defaultFormData: WorkoutFormData = {
  type: 'treino',
  exercises: [],
  notes: '',
  duration: 0,
};

const defaultExercise: Exercise = {
  id: '',
  name: '',
  sets: [],
  notes: '',
};

const defaultSet: Set = {
  reps: 0,
  weight: 0,
  duration: 0,
  rest: 60,
};

const Training = () => {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutEntry | null>(null);
  const [formData, setFormData] = useState<WorkoutFormData>(defaultFormData);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadWorkouts();
    setSelectedDate(today);
  }, []);

  const loadWorkouts = () => {
    const data = storage.getData();
    setWorkouts(data.workouts || []);
  };

  const saveWorkout = (workout: Omit<WorkoutEntry, 'id'>) => {
    const data = storage.getData();
    const newWorkout: WorkoutEntry = {
      ...workout,
      id: crypto.randomUUID(),
    };
    
    data.workouts = data.workouts || [];
    data.workouts.push(newWorkout);
    data.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
    loadWorkouts();
  };

  const updateWorkout = (id: string, workout: Partial<WorkoutEntry>) => {
    const data = storage.getData();
    const index = data.workouts?.findIndex(w => w.id === id) ?? -1;
    
    if (index >= 0 && data.workouts) {
      data.workouts[index] = { ...data.workouts[index], ...workout };
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
      loadWorkouts();
    }
  };

  const deleteWorkout = (id: string) => {
    const data = storage.getData();
    data.workouts = data.workouts?.filter(w => w.id !== id) || [];
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
    loadWorkouts();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === 'treino' && formData.exercises.length === 0) {
      toast.error('Adicione pelo menos um exercicio para treinos');
      return;
    }

    try {
      // Basic validation
      if (formData.duration && (formData.duration < 0 || formData.duration > 24 * 60)) {
        toast.error('Duração inválida');
        return;
      }

      const workoutData = {
        date: selectedDate,
        type: formData.type,
        exercises: formData.exercises,
        notes: formData.notes || undefined,
        duration: formData.duration || undefined,
      };

      if (editingWorkout) {
        updateWorkout(editingWorkout.id, workoutData);
        toast.success('Treino atualizado com sucesso!');
      } else {
        saveWorkout(workoutData);
        toast.success('Treino registrado com sucesso!');
      }
      
      closeDialog();
    } catch (error) {
      toast.error('Erro ao salvar treino');
    }
  };

  const handleEdit = (workout: WorkoutEntry) => {
    setEditingWorkout(workout);
    setFormData({
      type: workout.type,
      exercises: workout.exercises,
      notes: workout.notes || '',
      duration: workout.duration || 0,
    });
    setSelectedDate(workout.date);
    setIsDialogOpen(true);
  };

  const handleDelete = (workoutId: string) => {
    deleteWorkout(workoutId);
    toast.success('Treino excluido com sucesso!');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingWorkout(null);
    setFormData(defaultFormData);
    setSelectedDate(today);
  };

  const addExercise = () => {
    const newExercise: Exercise = {
      ...defaultExercise,
      id: crypto.randomUUID(),
      sets: [{ ...defaultSet }],
    };
    
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));
  };

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      ),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId),
    }));
  };

  const addSet = (exerciseId: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: [...ex.sets, { ...defaultSet }] }
          : ex
      ),
    }));
  };

  const updateSet = (exerciseId: string, setIndex: number, updates: Partial<Set>) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? {
              ...ex,
              sets: ex.sets.map((set, index) => 
                index === setIndex ? { ...set, ...updates } : set
              )
            }
          : ex
      ),
    }));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: ex.sets.filter((_, index) => index !== setIndex) }
          : ex
      ),
    }));
  };

  const getWorkoutTypeLabel = (type: string) => {
    const labels = {
      treino: 'Treino',
      descanso: 'Descanso',
      recuperacao: 'Recuperacao',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getWorkoutTypeColor = (type: string) => {
    const colors = {
      treino: 'bg-green-500',
      descanso: 'bg-blue-500',
      recuperacao: 'bg-yellow-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const todayWorkout = workouts.find(w => w.date === today);

  const getTotalReps = (exercise: Exercise) => {
    return exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
  };

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Treino & Shape
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Acompanhe sua evolucao fisica e registre seus treinos
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={'gradient-primary text-white border-0'}>
                <Plus className={'h-4 w-4 mr-2'} />
                Novo Treino
              </Button>
            </DialogTrigger>
            <DialogContent className={'max-w-4xl max-h-[90vh] overflow-y-auto'}>
              <DialogHeader>
                <DialogTitle>
                  {editingWorkout ? 'Editar Treino' : 'Registrar Novo Treino'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className={'space-y-6'}>
                {/* Data e Tipo */}
                <div className={'grid grid-cols-2 gap-4'}>
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
                  
                  <div className={'space-y-2'}>
                    <Label htmlFor={'type'}>Tipo</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'treino'}>Treino</SelectItem>
                        <SelectItem value={'descanso'}>Descanso</SelectItem>
                        <SelectItem value={'recuperacao'}>Recuperacao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Duracao */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'duration'}>Duracao (minutos)</Label>
                  <Input
                    id={'duration'}
                    type={'number'}
                    value={formData.duration || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    placeholder={'Ex: 60'}
                  />
                </div>

                {/* Exercicios */}
                {formData.type === 'treino' && (
                  <div className={'space-y-4'}>
                    <div className={'flex items-center justify-between'}>
                      <Label>Exercicios</Label>
                      <Button type={'button'} onClick={addExercise} size={'sm'}>
                        <Plus className={'h-4 w-4 mr-2'} />
                        Adicionar Exercicio
                      </Button>
                    </div>
                    
                    {formData.exercises.map((exercise, exerciseIndex) => (
                      <Card key={exercise.id} className={'p-4'}>
                        <div className={'space-y-4'}>
                          <div className={'flex items-center justify-between'}>
                            <Input
                              value={exercise.name}
                              onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                              placeholder={'Nome do exercicio'}
                              className={'flex-1 mr-2'}
                            />
                            <Button
                              type={'button'}
                              variant={'outline'}
                              size={'sm'}
                              onClick={() => removeExercise(exercise.id)}
                            >
                              <Trash2 className={'h-4 w-4'} />
                            </Button>
                          </div>
                          
                          {/* Series */}
                          <div className={'space-y-2'}>
                            <div className={'flex items-center justify-between'}>
                              <Label className={'text-sm'}>Series</Label>
                              <Button
                                type={'button'}
                                onClick={() => addSet(exercise.id)}
                                size={'sm'}
                                variant={'outline'}
                              >
                                <Plus className={'h-3 w-3 mr-1'} />
                                Serie
                              </Button>
                            </div>
                            
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className={'grid grid-cols-5 gap-2 items-center'}>
                                <div>
                                  <Label className={'text-xs'}>Reps</Label>
                                  <Input
                                    type={'number'}
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(exercise.id, setIndex, { reps: parseInt(e.target.value) || 0 })}
                                    placeholder={'12'}
                                  />
                                </div>
                                <div>
                                  <Label className={'text-xs'}>Peso (kg)</Label>
                                  <Input
                                    type={'number'}
                                    step={'0.5'}
                                    value={set.weight || ''}
                                    onChange={(e) => updateSet(exercise.id, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                                    placeholder={'10'}
                                  />
                                </div>
                                <div>
                                  <Label className={'text-xs'}>Tempo (s)</Label>
                                  <Input
                                    type={'number'}
                                    value={set.duration || ''}
                                    onChange={(e) => updateSet(exercise.id, setIndex, { duration: parseInt(e.target.value) || 0 })}
                                    placeholder={'30'}
                                  />
                                </div>
                                <div>
                                  <Label className={'text-xs'}>Descanso (s)</Label>
                                  <Input
                                    type={'number'}
                                    value={set.rest || ''}
                                    onChange={(e) => updateSet(exercise.id, setIndex, { rest: parseInt(e.target.value) || 60 })}
                                    placeholder={'60'}
                                  />
                                </div>
                                <Button
                                  type={'button'}
                                  variant={'outline'}
                                  size={'sm'}
                                  onClick={() => removeSet(exercise.id, setIndex)}
                                  className={'mt-5'}
                                >
                                  <Trash2 className={'h-3 w-3'} />
                                </Button>
                              </div>
                            ))}
                          </div>
                          
                          {/* Notas do exercicio */}
                          <Textarea
                            value={exercise.notes || ''}
                            onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                            placeholder={'Observacoes sobre o exercicio...'}
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Notas gerais */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'notes'}>Observacoes Gerais</Label>
                  <Textarea
                    id={'notes'}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={'Como foi o treino, como se sentiu, etc...'}
                    rows={3}
                  />
                </div>

                {/* Botoes */}
                <div className={'flex justify-end space-x-2 pt-4'}>
                  <Button type={'button'} variant={'outline'} onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type={'submit'} className={'gradient-primary text-white border-0'}>
                    {editingWorkout ? 'Atualizar' : 'Registrar'} Treino
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Workout */}
        {todayWorkout && (
          <Card className={'border-primary/20 bg-primary/5'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Activity className={'h-5 w-5 text-primary'} />
                <span>Treino de Hoje</span>
                <Badge 
                  variant={'outline'} 
                  className={`${getWorkoutTypeColor(todayWorkout.type)} text-white border-0`}
                >
                  {getWorkoutTypeLabel(todayWorkout.type)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={'grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'}>
                {todayWorkout.duration && (
                  <div className={'flex items-center space-x-2'}>
                    <Clock className={'h-4 w-4 text-muted-foreground'} />
                    <span>{todayWorkout.duration} minutos</span>
                  </div>
                )}
                <div className={'flex items-center space-x-2'}>
                  <Dumbbell className={'h-4 w-4 text-muted-foreground'} />
                  <span>{todayWorkout.exercises.length} exercicios</span>
                </div>
                <div className={'flex items-center space-x-2'}>
                  <Target className={'h-4 w-4 text-muted-foreground'} />
                  <span>
                    {todayWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} series
                  </span>
                </div>
              </div>
              {todayWorkout.notes && (
                <p className={'text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg'}>
                  {todayWorkout.notes}
                </p>
              )}

              {todayWorkout.exercises.length > 0 && (
                <div className={'mt-3'}>
                  <p className={'text-sm font-medium mb-2'}>Exercicios:</p>
                  <div className={'flex flex-wrap gap-1'}>
                    {todayWorkout.exercises.map((exercise, idx) => (
                      <Badge key={idx} variant={'secondary'} className={'text-xs'} data-testid={`exercise-badge-today-${idx}`}>
                        {exercise.name}{getTotalReps(exercise) ? ` (${getTotalReps(exercise)})` : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workouts History */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Calendar className={'h-5 w-5'} />
              <span>Historico de Treinos</span>
              <Badge variant={'outline'}>{workouts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedWorkouts.length === 0 ? (
              <div className={'text-center py-8 text-muted-foreground'}>
                <Dumbbell className={'h-12 w-12 mx-auto mb-4 opacity-50'} />
                <p>Nenhum treino registrado ainda.</p>
                <p className={'text-sm'}>Comece registrando seu primeiro treino!</p>
              </div>
            ) : (
              <div className={'space-y-4'}>
                {sortedWorkouts.map((workout) => (
                  <Card key={workout.id} className={'hover:shadow-md transition-shadow'}>
                    <CardContent className={'p-4'}>
                      <div className={'flex items-start justify-between'}>
                        <div className={'flex-1'}>
                          <div className={'flex items-center space-x-3 mb-2'}>
                            <h3 className={'font-semibold'}>
                              {new Date(workout.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </h3>
                            <Badge 
                              variant={'outline'} 
                              className={`${getWorkoutTypeColor(workout.type)} text-white border-0`}
                            >
                              {getWorkoutTypeLabel(workout.type)}
                            </Badge>
                          </div>
                          
                          <div className={'grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3'}>
                            {workout.duration && (
                              <div className={'flex items-center space-x-2'}>
                                <Clock className={'h-4 w-4'} />
                                <span>{workout.duration} min</span>
                              </div>
                            )}
                            <div className={'flex items-center space-x-2'}>
                              <Dumbbell className={'h-4 w-4'} />
                              <span>{workout.exercises.length} exercicios</span>
                            </div>
                            <div className={'flex items-center space-x-2'}>
                              <Target className={'h-4 w-4'} />
                              <span>
                                {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)} series
                              </span>
                            </div>
                          </div>
                          
                          {workout.exercises.length > 0 && (
                            <div className={'mb-3'}>
                              <p className={'text-sm font-medium mb-1'}>Exercicios:</p>
                              <div className={'flex flex-wrap gap-1'}>
                                {workout.exercises.map((exercise, index) => (
                                  <Badge key={index} variant={'secondary'} className={'text-xs'} data-testid={`exercise-badge-${workout.id}-${index}`}>
                                    {exercise.name}{getTotalReps(exercise) ? ` (${getTotalReps(exercise)})` : ''}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {workout.notes && (
                            <p className={'text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg'}>
                              {workout.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className={'flex items-center space-x-2 ml-4'}>
                          <Button
                            variant={'outline'}
                            size={'icon'}
                            onClick={() => handleEdit(workout)}
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
                                <AlertDialogTitle>Excluir Treino</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este treino? 
                                  Esta acao nao pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(workout.id)}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Training;