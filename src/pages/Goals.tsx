import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { Goal, Milestone } from '@/types';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  Trophy,
  Calendar,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  X,
  Flag,
  Clock
} from 'lucide-react';

interface GoalFormData {
  title: string;
  description: string;
  type: 'daily' | 'monthly' | 'long_term';
  deadline: string;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  milestones: Milestone[];
}

const defaultFormData: GoalFormData = {
  title: '',
  description: '',
  type: 'monthly',
  deadline: '',
  status: 'in_progress',
  progress: 0,
  milestones: [],
};

const defaultMilestone: Milestone = {
  id: '',
  title: '',
  description: '',
  completed: false,
};

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(defaultFormData);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadGoals();
    // Criar meta principal Glow Up 2026 se não existir
    createGlowUpGoalIfNotExists();
  }, []);

  const loadGoals = () => {
    const data = storage.getData();
    setGoals(data.goals || []);
  };

  const createGlowUpGoalIfNotExists = () => {
    const data = storage.getData();
    const hasGlowUpGoal = data.goals?.some(goal => 
      goal.title.toLowerCase().includes('glow up') && 
      goal.title.includes('2026')
    );

    if (!hasGlowUpGoal) {
      const glowUpGoal: Goal = {
        id: crypto.randomUUID(),
        title: 'Glow Up Completo 2026',
        description: 'Transformacao completa ate o final de 2026 - fisica, mental e emocional. Incluindo habitos consistentes, evolucao fisica, autoestima elevada e crescimento pessoal.',
        type: 'long_term',
        deadline: '2026-12-31',
        status: 'in_progress',
        progress: 0,
        milestones: [
          {
            id: crypto.randomUUID(),
            title: 'Estabelecer rotina de habitos',
            description: 'Criar e manter habitos diarios consistentes',
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            title: 'Definir metas de treino',
            description: 'Estabelecer rotina de exercicios e objetivos fisicos',
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            title: 'Melhorar autoestima',
            description: 'Trabalhar confianca e autoimagem positiva',
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            title: 'Desenvolver disciplina mental',
            description: 'Fortalecer foco, determinacao e resiliencia',
            completed: false,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.goals = data.goals || [];
      data.goals.unshift(glowUpGoal); // Adicionar no inicio
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
      loadGoals();
    }
  };

  const saveGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = storage.getData();
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    data.goals = data.goals || [];
    data.goals.push(newGoal);
    data.lastUpdated = now;
    
    localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
    loadGoals();
  };

  const updateGoal = (id: string, goal: Partial<Goal>) => {
    const data = storage.getData();
    const index = data.goals?.findIndex(g => g.id === id) ?? -1;
    
    if (index >= 0 && data.goals) {
      data.goals[index] = { 
        ...data.goals[index], 
        ...goal,
        updatedAt: new Date().toISOString()
      };
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
      loadGoals();
    }
  };

  const deleteGoal = (id: string) => {
    const data = storage.getData();
    data.goals = data.goals?.filter(g => g.id !== id) || [];
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem('glow-up-organizer-data', JSON.stringify(data));
    loadGoals();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Titulo da meta e obrigatorio');
      return;
    }

    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        deadline: formData.deadline || undefined,
        status: formData.status,
        progress: formData.progress,
        milestones: formData.milestones.filter(m => m.title.trim()),
      };

      if (editingGoal) {
        updateGoal(editingGoal.id, goalData);
        toast.success('Meta atualizada com sucesso!');
      } else {
        saveGoal(goalData);
        toast.success('Meta criada com sucesso!');
      }
      
      closeDialog();
    } catch (error) {
      toast.error('Erro ao salvar meta');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      deadline: goal.deadline || '',
      status: goal.status,
      progress: goal.progress,
      milestones: goal.milestones || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (goalId: string) => {
    deleteGoal(goalId);
    toast.success('Meta excluida com sucesso!');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData(defaultFormData);
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      ...defaultMilestone,
      id: crypto.randomUUID(),
    };
    
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  };

  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => 
        m.id === milestoneId ? { ...m, ...updates } : m
      ),
    }));
  };

  const removeMilestone = (milestoneId: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== milestoneId),
    }));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones?.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          completed: !m.completed,
          completedAt: !m.completed ? new Date().toISOString() : undefined,
        };
      }
      return m;
    }) || [];

    // Recalcular progresso baseado nos marcos
    const completedMilestones = updatedMilestones.filter(m => m.completed).length;
    const totalMilestones = updatedMilestones.length;
    const newProgress = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : goal.progress;

    updateGoal(goalId, { 
      milestones: updatedMilestones,
      progress: newProgress,
    });

    // Recarregar metas para atualizar a interface
    loadGoals();
    toast.success('Marco atualizado!');
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diaria',
      monthly: 'Mensal',
      long_term: 'Longo Prazo',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      daily: 'bg-green-500',
      monthly: 'bg-blue-500',
      long_term: 'bg-purple-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      in_progress: 'Em Andamento',
      completed: 'Concluida',
      paused: 'Pausada',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      paused: 'bg-yellow-500',
      cancelled: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredGoals = selectedType === 'all' 
    ? goals 
    : goals.filter(goal => goal.type === selectedType);

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    // Glow Up 2026 sempre primeiro
    if (a.title.includes('Glow Up 2026')) return -1;
    if (b.title.includes('Glow Up 2026')) return 1;
    // Depois por status (em andamento primeiro)
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    // Por fim por data de criacao
    return b.createdAt.localeCompare(a.createdAt);
  });

  const stats = {
    total: goals.length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    completed: goals.filter(g => g.status === 'completed').length,
    averageProgress: goals.length > 0 
      ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
      : 0,
  };

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Metas & Objetivos
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Defina e acompanhe suas metas de evolucao pessoal
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={'gradient-primary text-white border-0'}>
                <Plus className={'h-4 w-4 mr-2'} />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className={'max-w-3xl max-h-[90vh] overflow-y-auto'}>
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Editar Meta' : 'Nova Meta'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className={'space-y-6'}>
                {/* Titulo e Tipo */}
                <div className={'grid grid-cols-2 gap-4'}>
                  <div className={'space-y-2'}>
                    <Label htmlFor={'title'}>Titulo *</Label>
                    <Input
                      id={'title'}
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={'Ex: Perder 10kg ate junho'}
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
                        <SelectItem value={'daily'}>Diaria</SelectItem>
                        <SelectItem value={'monthly'}>Mensal</SelectItem>
                        <SelectItem value={'long_term'}>Longo Prazo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Descricao */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'description'}>Descricao</Label>
                  <Textarea
                    id={'description'}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={'Descreva sua meta em detalhes...'}
                    rows={3}
                  />
                </div>

                {/* Prazo e Status */}
                <div className={'grid grid-cols-2 gap-4'}>
                  <div className={'space-y-2'}>
                    <Label htmlFor={'deadline'}>Prazo</Label>
                    <Input
                      id={'deadline'}
                      type={'date'}
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                  
                  <div className={'space-y-2'}>
                    <Label htmlFor={'status'}>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'in_progress'}>Em Andamento</SelectItem>
                        <SelectItem value={'completed'}>Concluida</SelectItem>
                        <SelectItem value={'paused'}>Pausada</SelectItem>
                        <SelectItem value={'cancelled'}>Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Progresso */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'progress'}>Progresso (%)</Label>
                  <div className={'space-y-2'}>
                    <Input
                      id={'progress'}
                      type={'number'}
                      min={0}
                      max={100}
                      value={formData.progress}
                      onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                    />
                    <Progress value={formData.progress} className={'h-2'} />
                  </div>
                </div>

                {/* Marcos */}
                <div className={'space-y-4'}>
                  <div className={'flex items-center justify-between'}>
                    <Label>Marcos</Label>
                    <Button type={'button'} onClick={addMilestone} size={'sm'}>
                      <Plus className={'h-4 w-4 mr-2'} />
                      Adicionar Marco
                    </Button>
                  </div>
                  
                  {formData.milestones.map((milestone, index) => (
                    <Card key={milestone.id} className={'p-4'}>
                      <div className={'space-y-3'}>
                        <div className={'flex items-center justify-between'}>
                          <Input
                            value={milestone.title}
                            onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                            placeholder={'Titulo do marco'}
                            className={'flex-1 mr-2'}
                          />
                          <Button
                            type={'button'}
                            variant={'outline'}
                            size={'sm'}
                            onClick={() => removeMilestone(milestone.id)}
                          >
                            <Trash2 className={'h-4 w-4'} />
                          </Button>
                        </div>
                        
                        <Textarea
                          value={milestone.description || ''}
                          onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                          placeholder={'Descricao do marco (opcional)'}
                          rows={2}
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Botoes */}
                <div className={'flex justify-end space-x-2 pt-4'}>
                  <Button type={'button'} variant={'outline'} onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type={'submit'} className={'gradient-primary text-white border-0'}>
                    {editingGoal ? 'Atualizar' : 'Criar'} Meta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Total de Metas</CardTitle>
              <Target className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{stats.total}</div>
              <p className={'text-xs text-muted-foreground'}>
                Objetivos definidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Em Andamento</CardTitle>
              <Play className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{stats.inProgress}</div>
              <p className={'text-xs text-muted-foreground'}>
                Metas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Concluidas</CardTitle>
              <Trophy className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{stats.completed}</div>
              <p className={'text-xs text-muted-foreground'}>
                Objetivos alcancados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Progresso Medio</CardTitle>
              <Flag className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{stats.averageProgress}%</div>
              <p className={'text-xs text-muted-foreground'}>
                Performance geral
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className={'p-4'}>
            <div className={'flex flex-wrap items-center gap-2'}>
              <Label className={'text-sm font-medium'}>Filtrar por tipo:</Label>
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedType('all')}
              >
                Todas ({goals.length})
              </Button>
              <Button
                variant={selectedType === 'daily' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedType('daily')}
              >
                Diarias ({goals.filter(g => g.type === 'daily').length})
              </Button>
              <Button
                variant={selectedType === 'monthly' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedType('monthly')}
              >
                Mensais ({goals.filter(g => g.type === 'monthly').length})
              </Button>
              <Button
                variant={selectedType === 'long_term' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedType('long_term')}
              >
                Longo Prazo ({goals.filter(g => g.type === 'long_term').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        <div className={'space-y-4'}>
          {sortedGoals.length === 0 ? (
            <Card>
              <CardContent className={'p-8 text-center'}>
                <Target className={'h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50'} />
                <h3 className={'text-lg font-medium mb-2'}>Nenhuma meta encontrada</h3>
                <p className={'text-muted-foreground mb-4'}>
                  {selectedType === 'all' 
                    ? 'Comece definindo suas primeiras metas!'
                    : `Nenhuma meta do tipo ${getTypeLabel(selectedType)}.`
                  }
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className={'gradient-primary text-white border-0'}
                >
                  <Plus className={'h-4 w-4 mr-2'} />
                  Criar Primeira Meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className={`hover:shadow-md transition-shadow ${
                  goal.title.includes('Glow Up 2026') ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <CardContent className={'p-6'}>
                  <div className={'flex items-start justify-between'}>
                    <div className={'flex-1'}>
                      <div className={'flex items-center space-x-3 mb-3'}>
                        <h3 className={'text-lg font-semibold'}>{goal.title}</h3>
                        <Badge 
                          variant={'outline'} 
                          className={`${getTypeColor(goal.type)} text-white border-0`}
                        >
                          {getTypeLabel(goal.type)}
                        </Badge>
                        <Badge 
                          variant={'outline'} 
                          className={`${getStatusColor(goal.status)} text-white border-0`}
                        >
                          {getStatusLabel(goal.status)}
                        </Badge>
                        {goal.title.includes('Glow Up 2026') && (
                          <Badge variant={'default'} className={'gradient-glow text-white border-0'}>
                            <Trophy className={'h-3 w-3 mr-1'} />
                            Meta Principal
                          </Badge>
                        )}
                      </div>
                      
                      {goal.description && (
                        <p className={'text-sm text-muted-foreground mb-4'}>
                          {goal.description}
                        </p>
                      )}
                      
                      {/* Progresso */}
                      <div className={'mb-4'}>
                        <div className={'flex items-center justify-between mb-2'}>
                          <span className={'text-sm font-medium'}>Progresso</span>
                          <span className={'text-sm font-bold'}>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className={'h-3'} />
                      </div>
                      
                      {/* Prazo */}
                      {goal.deadline && (
                        <div className={'flex items-center space-x-2 mb-4 text-sm text-muted-foreground'}>
                          <Clock className={'h-4 w-4'} />
                          <span>
                            Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      
                      {/* Marcos */}
                      {goal.milestones && goal.milestones.length > 0 && (
                        <div className={'space-y-2'}>
                          <p className={'text-sm font-medium'}>Marcos:</p>
                          <div className={'space-y-2'}>
                            {goal.milestones.map((milestone) => (
                              <div 
                                key={milestone.id} 
                                className={'flex items-start space-x-2 p-2 rounded-lg bg-muted/30'}
                              >
                                <button
                                  onClick={() => toggleMilestone(goal.id, milestone.id)}
                                  className={'mt-0.5'}
                                >
                                  {milestone.completed ? (
                                    <CheckCircle2 className={'h-4 w-4 text-green-500'} />
                                  ) : (
                                    <Circle className={'h-4 w-4 text-muted-foreground'} />
                                  )}
                                </button>
                                <div className={'flex-1'}>
                                  <p className={`text-sm ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {milestone.title}
                                  </p>
                                  {milestone.description && (
                                    <p className={'text-xs text-muted-foreground mt-1'}>
                                      {milestone.description}
                                    </p>
                                  )}
                                  {milestone.completedAt && (
                                    <p className={'text-xs text-green-600 mt-1'}>
                                      Concluido em: {new Date(milestone.completedAt).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={'flex items-center space-x-2 ml-4'}>
                      <Button
                        variant={'outline'}
                        size={'icon'}
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className={'h-4 w-4'} />
                      </Button>
                      
                      {!goal.title.includes('Glow Up 2026') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant={'outline'} size={'icon'} className={'text-destructive hover:text-destructive'}>
                              <Trash2 className={'h-4 w-4'} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a meta "{goal.title}"? 
                                Esta acao nao pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(goal.id)}
                                className={'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Goals;