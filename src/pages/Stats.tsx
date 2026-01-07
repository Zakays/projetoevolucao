import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ProgressChart } from '@/components/ProgressChart';
import { storage } from '@/lib/storage';
import { Habit, HabitCompletion, WorkoutEntry, BodyMeasurement, JournalEntry, Goal, MonthlyChart } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Award,
  Target,
  Flame,
  Activity,
  Heart,
  BookOpen,
  Dumbbell,
  User,
  CheckCircle2,
  Clock,
  Star,
  History,
  LineChart
} from 'lucide-react';

interface StatsData {
  habits: {
    total: number;
    activeToday: number;
    completedToday: number;
    averageCompletion: number;
    bestStreak: number;
    totalCompletions: number;
    categoryStats: { [key: string]: { total: number; completed: number } };
  };
  workouts: {
    total: number;
    thisMonth: number;
    totalDuration: number;
    averageDuration: number;
    totalExercises: number;
    totalSets: number;
  };
  body: {
    totalMeasurements: number;
    latestWeight: number | null;
    weightChange: number | null;
    averageEnergy: number;
    averageConfidence: number;
    averageSelfEsteem: number;
  };
  journal: {
    totalEntries: number;
    thisMonth: number;
    averageMood: number;
    bestMood: number;
    worstMood: number;
    streak: number;
  };
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
    totalMilestones: number;
    completedMilestones: number;
  };
}

const Stats = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('charts');
  const [monthlyCharts, setMonthlyCharts] = useState<MonthlyChart[]>([]);

  useEffect(() => {
    calculateStats();
    loadMonthlyCharts();
  }, [selectedPeriod]);

  const loadMonthlyCharts = () => {
    const charts = storage.getAllMonthlyCharts();
    setMonthlyCharts(charts);
  };

  const calculateStats = () => {
    const data = storage.getData();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Filtrar dados por período
    const filterByPeriod = (dateStr: string) => {
      if (selectedPeriod === 'all') return true;
      if (selectedPeriod === 'month') return dateStr.startsWith(thisMonth);
      if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(dateStr + 'T00:00:00') >= weekAgo;
      }
      return true;
    };

    // Estatísticas de Hábitos
    const habits = data.habits || [];
    const habitCompletions = (data.habitCompletions || []).filter(c => filterByPeriod(c.date));
    const todayHabits = storage.getTodayHabits();
    const todayCompletions = storage.getHabitCompletions();
    
    const categoryStats: { [key: string]: { total: number; completed: number } } = {};
    habits.forEach(habit => {
      if (!categoryStats[habit.category]) {
        categoryStats[habit.category] = { total: 0, completed: 0 };
      }
      categoryStats[habit.category].total++;
      
      const completions = habitCompletions.filter(c => c.habitId === habit.id && c.status === 'completed');
      categoryStats[habit.category].completed += completions.length;
    });

    const habitStats = {
      total: habits.length,
      activeToday: todayHabits.length,
      completedToday: todayCompletions.filter(c => c.status === 'completed').length,
      averageCompletion: habits.length > 0 
        ? Math.round((habitCompletions.filter(c => c.status === 'completed').length / Math.max(habitCompletions.length, 1)) * 100)
        : 0,
      bestStreak: Math.max(...habits.map(h => h.streak), 0),
      totalCompletions: habitCompletions.filter(c => c.status === 'completed').length,
      categoryStats,
    };

    // Estatísticas de Treino
    const workouts = (data.workouts || []).filter(w => filterByPeriod(w.date));
    const thisMonthWorkouts = (data.workouts || []).filter(w => w.date.startsWith(thisMonth));
    
    const workoutStats = {
      total: workouts.length,
      thisMonth: thisMonthWorkouts.length,
      totalDuration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      averageDuration: workouts.length > 0 
        ? Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length)
        : 0,
      totalExercises: workouts.reduce((sum, w) => sum + w.exercises.length, 0),
      totalSets: workouts.reduce((sum, w) => 
        sum + w.exercises.reduce((exerciseSum, ex) => exerciseSum + ex.sets.length, 0), 0
      ),
    };

    // Estatísticas do Corpo
    const bodyMeasurements = (data.bodyMeasurements || []).filter(m => filterByPeriod(m.date));
    const sortedMeasurements = [...bodyMeasurements].sort((a, b) => b.date.localeCompare(a.date));
    const latestMeasurement = sortedMeasurements[0];
    const previousMeasurement = sortedMeasurements[1];
    
    const bodyStats = {
      totalMeasurements: bodyMeasurements.length,
      latestWeight: latestMeasurement?.weight || null,
      weightChange: latestMeasurement?.weight && previousMeasurement?.weight 
        ? latestMeasurement.weight - previousMeasurement.weight
        : null,
      averageEnergy: bodyMeasurements.length > 0
        ? Math.round(bodyMeasurements.reduce((sum, m) => sum + m.selfAssessment.energy, 0) / bodyMeasurements.length * 10) / 10
        : 0,
      averageConfidence: bodyMeasurements.length > 0
        ? Math.round(bodyMeasurements.reduce((sum, m) => sum + m.selfAssessment.confidence, 0) / bodyMeasurements.length * 10) / 10
        : 0,
      averageSelfEsteem: bodyMeasurements.length > 0
        ? Math.round(bodyMeasurements.reduce((sum, m) => sum + m.selfAssessment.selfEsteem, 0) / bodyMeasurements.length * 10) / 10
        : 0,
    };

    // Estatísticas do Diário
    const journalEntries = (data.journalEntries || []).filter(e => filterByPeriod(e.date));
    const thisMonthEntries = (data.journalEntries || []).filter(e => e.date.startsWith(thisMonth));
    
    // Calcular streak de diário
    let journalStreak = 0;
    const today_date = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today_date);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasEntry = (data.journalEntries || []).some(e => e.date === dateStr);
      if (hasEntry) {
        journalStreak++;
      } else {
        break;
      }
    }

    const journalStats = {
      totalEntries: journalEntries.length,
      thisMonth: thisMonthEntries.length,
      averageMood: journalEntries.length > 0
        ? Math.round(journalEntries.reduce((sum, e) => sum + e.mood, 0) / journalEntries.length * 10) / 10
        : 0,
      bestMood: Math.max(...journalEntries.map(e => e.mood), 0),
      worstMood: journalEntries.length > 0 ? Math.min(...journalEntries.map(e => e.mood)) : 0,
      streak: journalStreak,
    };

    // Estatísticas de Metas
    const goals = data.goals || [];
    const goalStats = {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      averageProgress: goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0,
      totalMilestones: goals.reduce((sum, g) => sum + (g.milestones?.length || 0), 0),
      completedMilestones: goals.reduce((sum, g) => 
        sum + (g.milestones?.filter(m => m.completed).length || 0), 0
      ),
    };

    setStats({
      habits: habitStats,
      workouts: workoutStats,
      body: bodyStats,
      journal: journalStats,
      goals: goalStats,
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      saude: 'Saúde',
      treino: 'Treino',
      estudo: 'Estudo',
      estetica: 'Estética',
      disciplina: 'Disciplina',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      saude: 'bg-green-500',
      treino: 'bg-orange-500',
      estudo: 'bg-blue-500',
      estetica: 'bg-pink-500',
      disciplina: 'bg-purple-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      all: 'Todo o período',
      month: 'Este mês',
      week: 'Esta semana',
    };
    return labels[period as keyof typeof labels] || period;
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Build mood (humor) series for a given month by averaging journal entries per day
  const buildMoodSeriesForMonth = (month: string) => {
    const data = storage.getData();
    const journalEntries = (data.journalEntries || []).filter((e: any) => e.date.startsWith(month));
    const year = parseInt(month.split('-')[0], 10);
    const mon = parseInt(month.split('-')[1], 10);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const series: { date: string; value: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${month}-${String(d).padStart(2, '0')}`;
      const entries = journalEntries.filter((je: any) => je.date === date && typeof je.mood === 'number');
      if (entries.length === 0) continue;
      const avg = Math.round(entries.reduce((s: number, e: any) => s + e.mood, 0) / entries.length);
      series.push({ date, value: avg });
    }
    return series;
  };

  // Build workouts series: total duration (minutes) per day
  const buildWorkoutsSeriesForMonth = (month: string) => {
    const data = storage.getData();
    const workouts = (data.workouts || []).filter((w: any) => w.date.startsWith(month));
    const year = parseInt(month.split('-')[0], 10);
    const mon = parseInt(month.split('-')[1], 10);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const map: Record<string, number> = {};
    workouts.forEach((w: any) => {
      map[w.date] = (map[w.date] || 0) + (w.duration || 0);
    });
    const series: { date: string; value: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${month}-${String(d).padStart(2, '0')}`;
      if (map[date]) series.push({ date, value: map[date] });
    }
    return series;
  };

  const currentMonthChart = monthlyCharts.find(chart => chart.month === getCurrentMonth());
  const historicalCharts = monthlyCharts.filter(chart => chart.month !== getCurrentMonth());

  // Build a live view for the current month by merging stored daily stats
  // with today's computed stats so the chart shows progress immediately.
  const buildDisplayedCurrentChart = (): MonthlyChart | null => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const targetMonth = getCurrentMonth();

    // Compute today's stats from current habits/completions
    const todayHabits = storage.getTodayHabits(today);
    const todayCompletions = storage.getHabitCompletions(today);
    const totalHabits = todayHabits.length;
    const completedHabits = todayCompletions.filter(c => c.status === 'completed').length;
    const totalPoints = todayHabits.reduce((sum, h) => sum + (h.weight || 0), 0);
    const earnedPoints = todayCompletions
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => {
        const h = todayHabits.find(hh => hh.id === c.habitId);
        return sum + (h?.weight || 0);
      }, 0);

    const todayStats = {
      date: today,
      totalHabits,
      completedHabits,
      totalPoints,
      earnedPoints,
      percentage: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0,
    };

    if (currentMonthChart) {
      // clone existing chart and merge/replace today's stat
      const clone: MonthlyChart = JSON.parse(JSON.stringify(currentMonthChart));
      clone.dailyStats = clone.dailyStats.filter(s => s.date !== today);
      clone.dailyStats.push(todayStats);
      clone.dailyStats.sort((a, b) => a.date.localeCompare(b.date));
      // update summary values locally so ProgressChart shows correct averages
      if (clone.dailyStats.length > 0) {
        clone.totalDays = clone.dailyStats.length;
        clone.completedDays = clone.dailyStats.filter(s => s.percentage >= 80).length;
        clone.averagePerformance = Math.round(clone.dailyStats.reduce((sum, s) => sum + s.percentage, 0) / clone.dailyStats.length);
        const sortedByPerformance = [...clone.dailyStats].sort((a, b) => b.percentage - a.percentage);
        clone.bestDay = sortedByPerformance[0]?.date || '';
        clone.worstDay = sortedByPerformance[sortedByPerformance.length - 1]?.date || '';
      }
      return clone;
    }

    // No stored chart for current month — create a temporary one containing only today
    return {
      month: targetMonth,
      dailyStats: [todayStats],
      averagePerformance: todayStats.percentage,
      bestDay: todayStats.date,
      worstDay: todayStats.date,
      totalDays: 1,
      completedDays: todayStats.percentage >= 80 ? 1 : 0,
    } as MonthlyChart;
  };

  const displayedCurrentChart = buildDisplayedCurrentChart();

  if (!stats) {
    return (
      <Layout>
        <div className={'flex items-center justify-center min-h-[400px]'}>
          <div className={'text-center'}>
            <BarChart3 className={'h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse'} />
            <p>Calculando estatísticas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Estatísticas & Insights
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Analise seu progresso e descubra padrões de comportamento
            </p>
          </div>
          
          <div className={'flex items-center space-x-2'}>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className={'w-40'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'all'}>Todo o período</SelectItem>
                <SelectItem value={'month'}>Este mês</SelectItem>
                <SelectItem value={'week'}>Esta semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Filter */}
        <Card>
          <CardContent className={'p-4'}>
            <div className={'flex flex-wrap items-center gap-2'}>
              <span className={'text-sm font-medium mr-2'}>Visualizar:</span>
              <Button
                variant={selectedCategory === 'charts' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('charts')}
              >
                <LineChart className={'h-4 w-4 mr-2'} />
                Gráficos de Progresso
              </Button>
              <Button
                variant={selectedCategory === 'history' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('history')}
              >
                <History className={'h-4 w-4 mr-2'} />
                Histórico de Gráficos
              </Button>
              <Button
                variant={selectedCategory === 'overview' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('overview')}
              >
                Visão Geral
              </Button>
              <Button
                variant={selectedCategory === 'habits' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('habits')}
              >
                Hábitos
              </Button>
              <Button
                variant={selectedCategory === 'workouts' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('workouts')}
              >
                Treinos
              </Button>
              <Button
                variant={selectedCategory === 'body' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('body')}
              >
                Corpo
              </Button>
              <Button
                variant={selectedCategory === 'journal' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('journal')}
              >
                Diário
              </Button>
              <Button
                variant={selectedCategory === 'goals' ? 'default' : 'outline'}
                size={'sm'}
                onClick={() => setSelectedCategory('goals')}
              >
                Metas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Charts */}
        {selectedCategory === 'charts' && (
          <div className={'space-y-6'}>
            <div className={'flex items-center space-x-2 mb-4'}>
              <LineChart className={'h-5 w-5 text-primary'} />
              <h2 className={'text-xl font-semibold'}>Gráfico de Progresso Mensal</h2>
            </div>
            
            {displayedCurrentChart && displayedCurrentChart.dailyStats.length > 0 ? (
              <ProgressChart
                monthlyChart={displayedCurrentChart}
                isCurrentMonth={true}
                multiSeries={[
                  { id: 'mood', label: 'Humor', color: '#8b5cf6', values: buildMoodSeriesForMonth(displayedCurrentChart.month), scale: 'zeroToTen', unit: '' },
                  { id: 'workouts', label: 'Treino', color: '#fb923c', values: buildWorkoutsSeriesForMonth(displayedCurrentChart.month), scale: 'relative', unit: 'min' },
                ]}
              />
            ) : (
              <Card>
                <CardContent className={'p-8 text-center'}>
                  <LineChart className={'h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50'} />
                  <h3 className={'text-lg font-medium mb-2'}>Nenhum dado este mês</h3>
                  <p className={'text-muted-foreground mb-4'}>
                    Comece completando hábitos para ver seu gráfico de progresso se formar!
                  </p>
                  <p className={'text-sm text-muted-foreground'}>
                    O gráfico mostra sua performance diária baseada na conclusão de hábitos.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Explicação do gráfico */}
            <Card>
              <CardHeader>
                <CardTitle className={'flex items-center space-x-2'}>
                  <Target className={'h-5 w-5'} />
                  <span>Como funciona o gráfico</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={'space-y-3 text-sm'}>
                  <div className={'flex items-start space-x-2'}>
                    <div className={'w-2 h-2 rounded-full bg-green-500 mt-2'} />
                    <div>
                      <p className={'font-medium'}>Performance diária baseada em hábitos</p>
                      <p className={'text-muted-foreground'}>
                        Cada ponto representa a porcentagem de hábitos concluídos no dia
                      </p>
                    </div>
                  </div>
                  <div className={'flex items-start space-x-2'}>
                    <div className={'w-2 h-2 rounded-full bg-blue-500 mt-2'} />
                    <div>
                      <p className={'font-medium'}>Atualização automática</p>
                      <p className={'text-muted-foreground'}>
                        O gráfico se atualiza conforme você completa hábitos durante o mês
                      </p>
                    </div>
                  </div>
                  <div className={'flex items-start space-x-2'}>
                    <div className={'w-2 h-2 rounded-full bg-purple-500 mt-2'} />
                    <div>
                      <p className={'font-medium'}>Arquivo mensal</p>
                      <p className={'text-muted-foreground'}>
                        No final do mês, o gráfico é salvo no histórico e um novo é criado
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Historical Charts */}
        {selectedCategory === 'history' && (
          <div className={'space-y-6'}>
            <div className={'flex items-center space-x-2 mb-4'}>
              <History className={'h-5 w-5 text-primary'} />
              <h2 className={'text-xl font-semibold'}>Histórico de Gráficos Mensais</h2>
            </div>
            
                {historicalCharts.length > 0 ? (
              <div className={'space-y-6'}>
                {historicalCharts.map((chart) => (
                  <ProgressChart
                    key={chart.month}
                    monthlyChart={chart}
                    multiSeries={[
                      { id: 'mood', label: 'Humor', color: '#8b5cf6', values: buildMoodSeriesForMonth(chart.month), scale: 'zeroToTen', unit: '' },
                      { id: 'workouts', label: 'Treino', color: '#fb923c', values: buildWorkoutsSeriesForMonth(chart.month), scale: 'relative', unit: 'min' },
                    ]}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className={'p-8 text-center'}>
                  <History className={'h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50'} />
                  <h3 className={'text-lg font-medium mb-2'}>Nenhum histórico ainda</h3>
                  <p className={'text-muted-foreground mb-4'}>
                    Os gráficos dos meses anteriores aparecerão aqui conforme você usar o sistema.
                  </p>
                  <p className={'text-sm text-muted-foreground'}>
                    Continue completando hábitos para construir seu histórico de evolução!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Overview Stats */}
        {selectedCategory === 'overview' && (
          <>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Hábitos Hoje</CardTitle>
                  <CheckCircle2 className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>
                    {stats.habits.completedToday}/{stats.habits.activeToday}
                  </div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.habits.activeToday > 0 
                      ? Math.round((stats.habits.completedToday / stats.habits.activeToday) * 100)
                      : 0
                    }% concluído
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Treinos Este Mês</CardTitle>
                  <Dumbbell className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.workouts.thisMonth}</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.workouts.averageDuration > 0 && `${stats.workouts.averageDuration} min médio`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Humor Médio</CardTitle>
                  <Heart className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.journal.averageMood}/10</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.journal.averageMood >= 7 ? 'Muito positivo' : 
                     stats.journal.averageMood >= 5 ? 'Equilibrado' : 'Precisa atenção'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Progresso Metas</CardTitle>
                  <Target className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.goals.averageProgress}%</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.goals.completed}/{stats.goals.total} concluídas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className={'flex items-center space-x-2'}>
                  <Award className={'h-5 w-5'} />
                  <span>Insights Rápidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                  <div className={'space-y-3'}>
                    <div className={'flex items-center space-x-2 text-sm'}>
                      <Flame className={'h-4 w-4 text-orange-500'} />
                      <span>Maior sequência de hábitos: <strong>{stats.habits.bestStreak} dias</strong></span>
                    </div>
                    <div className={'flex items-center space-x-2 text-sm'}>
                      <Activity className={'h-4 w-4 text-blue-500'} />
                      <span>Total de exercícios realizados: <strong>{stats.workouts.totalExercises}</strong></span>
                    </div>
                    <div className={'flex items-center space-x-2 text-sm'}>
                      <BookOpen className={'h-4 w-4 text-purple-500'} />
                      <span>Sequência de reflexões: <strong>{stats.journal.streak} dias</strong></span>
                    </div>
                  </div>
                  <div className={'space-y-3'}>
                    <div className={'flex items-center space-x-2 text-sm'}>
                      <Clock className={'h-4 w-4 text-green-500'} />
                      <span>Tempo total de treino: <strong>{Math.round(stats.workouts.totalDuration / 60)} horas</strong></span>
                    </div>
                    <div className={'flex items-center space-x-2 text-sm'}>
                      <Star className={'h-4 w-4 text-yellow-500'} />
                      <span>Marcos concluídos: <strong>{stats.goals.completedMilestones}/{stats.goals.totalMilestones}</strong></span>
                    </div>
                    {stats.body.latestWeight && (
                      <div className={'flex items-center space-x-2 text-sm'}>
                        <User className={'h-4 w-4 text-pink-500'} />
                        <span>Peso atual: <strong>{stats.body.latestWeight} kg</strong></span>
                        {stats.body.weightChange && (
                          <span className={stats.body.weightChange > 0 ? 'text-red-500' : 'text-green-500'}>
                            ({stats.body.weightChange > 0 ? '+' : ''}{stats.body.weightChange.toFixed(1)} kg)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Habits Stats */}
        {selectedCategory === 'habits' && (
          <>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Total de Hábitos</CardTitle>
                  <CheckCircle2 className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.habits.total}</div>
                  <p className={'text-xs text-muted-foreground'}>Hábitos criados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Taxa de Conclusão</CardTitle>
                  <TrendingUp className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.habits.averageCompletion}%</div>
                  <p className={'text-xs text-muted-foreground'}>Média geral</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Melhor Sequência</CardTitle>
                  <Flame className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.habits.bestStreak}</div>
                  <p className={'text-xs text-muted-foreground'}>Dias consecutivos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Total Concluídos</CardTitle>
                  <Award className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.habits.totalCompletions}</div>
                  <p className={'text-xs text-muted-foreground'}>Hábitos realizados</p>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={'space-y-4'}>
                  {Object.entries(stats.habits.categoryStats).map(([category, data]) => {
                    const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                    return (
                      <div key={category} className={'space-y-2'}>
                        <div className={'flex items-center justify-between'}>
                          <div className={'flex items-center space-x-2'}>
                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                            <span className={'font-medium'}>{getCategoryLabel(category)}</span>
                          </div>
                          <div className={'text-sm text-muted-foreground'}>
                            {data.completed}/{data.total} ({percentage}%)
                          </div>
                        </div>
                        <Progress value={percentage} className={'h-2'} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Workout Stats */}
        {selectedCategory === 'workouts' && (
          <>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Total de Treinos</CardTitle>
                  <Dumbbell className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.workouts.total}</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {getPeriodLabel(selectedPeriod)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Tempo Total</CardTitle>
                  <Clock className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>
                    {Math.round(stats.workouts.totalDuration / 60)}h
                  </div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.workouts.totalDuration} minutos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Duração Média</CardTitle>
                  <TrendingUp className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.workouts.averageDuration}</div>
                  <p className={'text-xs text-muted-foreground'}>Minutos por treino</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Total de Séries</CardTitle>
                  <Activity className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.workouts.totalSets}</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.workouts.totalExercises} exercícios
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Body Stats */}
        {selectedCategory === 'body' && (
          <>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Medições</CardTitle>
                  <User className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.body.totalMeasurements}</div>
                  <p className={'text-xs text-muted-foreground'}>Registros corporais</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Energia Média</CardTitle>
                  <Activity className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.body.averageEnergy}/10</div>
                  <p className={'text-xs text-muted-foreground'}>Nível de energia</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Confiança Média</CardTitle>
                  <Heart className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.body.averageConfidence}/10</div>
                  <p className={'text-xs text-muted-foreground'}>Nível de confiança</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Autoestima Média</CardTitle>
                  <Star className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.body.averageSelfEsteem}/10</div>
                  <p className={'text-xs text-muted-foreground'}>Nível de autoestima</p>
                </CardContent>
              </Card>
            </div>

            {stats.body.latestWeight && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do Peso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={'flex items-center space-x-4'}>
                    <div>
                      <p className={'text-2xl font-bold'}>{stats.body.latestWeight} kg</p>
                      <p className={'text-sm text-muted-foreground'}>Peso atual</p>
                    </div>
                    {stats.body.weightChange && (
                      <div className={'flex items-center space-x-2'}>
                        {stats.body.weightChange > 0 ? (
                          <TrendingUp className={'h-5 w-5 text-red-500'} />
                        ) : (
                          <TrendingDown className={'h-5 w-5 text-green-500'} />
                        )}
                        <div>
                          <p className={`font-medium ${stats.body.weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {stats.body.weightChange > 0 ? '+' : ''}{stats.body.weightChange.toFixed(1)} kg
                          </p>
                          <p className={'text-xs text-muted-foreground'}>Desde última medição</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Journal Stats */}
        {selectedCategory === 'journal' && (
          <>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Total de Reflexões</CardTitle>
                  <BookOpen className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.journal.totalEntries}</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {getPeriodLabel(selectedPeriod)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Humor Médio</CardTitle>
                  <Heart className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.journal.averageMood}/10</div>
                  <p className={'text-xs text-muted-foreground'}>Bem-estar geral</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Melhor Humor</CardTitle>
                  <TrendingUp className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.journal.bestMood}/10</div>
                  <p className={'text-xs text-muted-foreground'}>Pico de bem-estar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Sequência</CardTitle>
                  <Flame className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.journal.streak}</div>
                  <p className={'text-xs text-muted-foreground'}>Dias consecutivos</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Goals Stats */}
        {selectedCategory === 'goals' && (
          <>
            <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Total de Metas</CardTitle>
                  <Target className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.goals.total}</div>
                  <p className={'text-xs text-muted-foreground'}>Objetivos definidos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Concluídas</CardTitle>
                  <Award className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.goals.completed}</div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.goals.total > 0 
                      ? Math.round((stats.goals.completed / stats.goals.total) * 100)
                      : 0
                    }% do total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Progresso Médio</CardTitle>
                  <TrendingUp className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{stats.goals.averageProgress}%</div>
                  <p className={'text-xs text-muted-foreground'}>Todas as metas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Marcos</CardTitle>
                  <Star className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>
                    {stats.goals.completedMilestones}/{stats.goals.totalMilestones}
                  </div>
                  <p className={'text-xs text-muted-foreground'}>
                    {stats.goals.totalMilestones > 0 
                      ? Math.round((stats.goals.completedMilestones / stats.goals.totalMilestones) * 100)
                      : 0
                    }% concluídos
                  </p>
                </CardContent>
              </Card>
            </div>

            {stats.goals.totalMilestones > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Progresso dos Marcos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={'space-y-2'}>
                    <div className={'flex justify-between text-sm'}>
                      <span>Marcos concluídos</span>
                      <span>
                        {Math.round((stats.goals.completedMilestones / stats.goals.totalMilestones) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(stats.goals.completedMilestones / stats.goals.totalMilestones) * 100} 
                      className={'h-3'} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Stats;