import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/storage';
import { Habit, HabitCompletion, DailyStats } from '@/types';
import { toast } from 'sonner';
import { generateReply } from '@/lib/ai';
import { composeMotivationPrompt, sanitizeMotivation } from '@/lib/motivation';
import { 
  Calendar,
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Target, 
  TrendingUp,
  Sparkles,
  Edit3,
  Save,
  X
} from 'lucide-react';
import AIChat from '@/components/AIChat';

const Index = () => {
  // Debug: mostrar variáveis de ambiente
  const debugInfo = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_PERSISTENCE_BASE_URL: import.meta.env.VITE_PERSISTENCE_BASE_URL,
    VITE_MOBILE_POLL_MS: import.meta.env.VITE_MOBILE_POLL_MS,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE
  };

  // Estado para mostrar logs de sincronização
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isTestingSync, setIsTestingSync] = useState(false);

  const addLog = (message: string) => {
    setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setSyncLogs([]);
  };

  const testSync = async () => {
    setIsTestingSync(true);
    addLog('🧪 Iniciando teste de sincronização...');

    try {
      // Primeiro testar conectividade básica com a internet
      addLog('🌐 Testando conectividade básica...');
      try {
        const response = await fetch('https://httpbin.org/get', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        addLog(`🌐 Internet: ${response.status} ${response.statusText}`);
      } catch (connError) {
        addLog(`🌐 Erro de internet: ${connError.message}`);
        addLog('⚠️  Dispositivo pode não ter conexão com a internet');
      }

      // Testar conectividade com o servidor específico
      addLog('🌐 Testando conectividade com servidor...');
      try {
        const baseUrl = import.meta.env.VITE_PERSISTENCE_BASE_URL || 'http://localhost:3001';
        addLog(`🌐 URL do servidor: ${baseUrl}`);

        const response = await fetch(`${baseUrl}/api/load?key=test`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        addLog(`🌐 Servidor: ${response.status} ${response.statusText}`);
      } catch (connError) {
        addLog(`🌐 Erro de conectividade: ${connError.message}`);
        addLog('💡 Possíveis causas:');
        addLog('   - Servidor não está rodando');
        addLog('   - Problemas de CORS');
        addLog('   - Firewall bloqueando');
        addLog('   - Endpoint não existe');
        addLog('💡 Soluções sugeridas:');
        addLog('   1. Execute: npm run start:server');
        addLog('   2. Use servidor local: http://localhost:3000');
        addLog('   3. Verifique se o servidor Vercel está ativo');
      }

      // Testar backup
      addLog('📤 Testando backup...');
      try {
        const backupResult = await (storage as any).backupToSupabase();
        addLog(`📤 Backup: ${backupResult ? '✅ Sucesso' : '❌ Falhou'}`);
      } catch (backupError) {
        addLog(`📤 Backup erro: ${backupError.message}`);
        if (backupError.stack) {
          addLog(`📤 Stack: ${backupError.stack.split('\n')[0]}`);
        }
      }

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Testar restore
      addLog('📥 Testando restore...');
      try {
        const restoreResult = await (storage as any).restoreFromSupabase();
        addLog(`📥 Restore: ${restoreResult ? '✅ Sucesso' : '❌ Falhou (dados locais mais recentes)'}`);
      } catch (restoreError) {
        addLog(`📥 Restore erro: ${restoreError.message}`);
        if (restoreError.stack) {
          addLog(`📥 Stack: ${restoreError.stack.split('\n')[0]}`);
        }
        // Tentar obter mais detalhes
        try {
          const remote = await (storage as any).loadDataRemote((storage as any).STORAGE_KEY);
          addLog(`📥 Dados remotos: ${remote ? 'Encontrados' : 'Não encontrados'}`);
          if (remote && remote.updated_at) {
            addLog(`📥 Timestamp remoto: ${remote.updated_at}`);
          }
        } catch (remoteError) {
          addLog(`📥 Erro ao verificar dados remotos: ${remoteError.message}`);
        }
      }

      // Verificar queue
      try {
        const queue = (storage as any).getSyncQueue();
        addLog(`📋 Queue: ${queue ? queue.length : 0} items`);
      } catch (queueError) {
        addLog(`📋 Queue erro: ${queueError.message}`);
      }

    } catch (error) {
      addLog(`❌ Erro geral: ${error.message}`);
      if (error.stack) {
        addLog(`❌ Stack: ${error.stack.split('\n')[0]}`);
      }
    }

    setIsTestingSync(false);
  };

  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [dailyMotivation, setDailyMotivation] = useState('');
  const [isEditingMotivation, setIsEditingMotivation] = useState(false);
  const [tempMotivation, setTempMotivation] = useState('');
  const [settings, setSettings] = useState(() => storage.getSettings());

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayFormatted = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    loadDashboardData();
    const onDataChanged = () => loadDashboardData();
    window.addEventListener('glowup:data-changed', onDataChanged);
    return () => window.removeEventListener('glowup:data-changed', onDataChanged);
  }, []);

  const loadDashboardData = () => {
    const habits = storage.getTodayHabits();
    const completions = storage.getHabitCompletions();
    const stats = calculateDailyStats(habits, completions);
    const settings = storage.getSettings();
    
    setTodayHabits(habits);
    setHabitCompletions(completions);
    setDailyStats(stats);
    setDailyMotivation(settings.dailyMotivation);
    setTempMotivation(settings.dailyMotivation);
    setSettings(settings);

    // Try to auto-generate daily motivation if needed (runs async, non-blocking)
    generateDailyMotivationIfNeeded();
  };

  const generateDailyMotivationIfNeeded = async () => {
    try {
      const settings = storage.getSettings();
      const today = new Date().toISOString().split('T')[0];
      if (settings.lastMotivationGeneratedAt === today) return;

      // prepare prompt from recent AI conversation history and user preferences (extracted to helper)
      const convo = storage.getAIConversations() || [];
      const tone = settings.motivationTone || 'encorajador';
      const length = settings.motivationLength || 'short';

      const prompt = composeMotivationPrompt(convo, tone, length);

      // call model
      const raw = await generateReply(prompt);
      if (!raw) return;

      // sanitize and persist
      const reply = sanitizeMotivation(raw, 200);

      // Save generated phrase and mark date
      storage.updateSettings({ dailyMotivation: reply, lastMotivationGeneratedAt: today });
      setDailyMotivation(reply);
      setTempMotivation(reply);
      toast.success('Frase do dia gerada! 🎯');
    } catch (e) {
      console.warn('Failed generating daily motivation', e);
    }
  };

  const calculateDailyStats = (habits: Habit[], completions: HabitCompletion[]): DailyStats => {
    const totalHabits = habits.length;
    const completedHabits = completions.filter(c => c.status === 'completed').length;
    const totalPoints = habits.reduce((sum, habit) => sum + habit.weight, 0);
    const earnedPoints = completions
      .filter(c => c.status === 'completed')
      .reduce((sum, completion) => {
        const habit = habits.find(h => h.id === completion.habitId);
        return sum + (habit?.weight || 0);
      }, 0);
    
    return {
      date: todayStr,
      totalHabits,
      completedHabits,
      totalPoints,
      earnedPoints,
      percentage: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0,
    };
  };

  const toggleHabit = (habitId: string) => {
    const completion = habitCompletions.find(c => c.habitId === habitId);
    const newStatus = completion?.status === 'completed' ? 'not_completed' : 'completed';
    
    storage.completeHabit(habitId, newStatus);
    
    if (newStatus === 'completed') {
      toast.success('Hábito concluído! 🎉', {
        description: 'Parabéns por manter a consistência!'
      });
    }
    
    loadDashboardData();
  };

  const saveMotivation = () => {
    storage.updateSettings({ dailyMotivation: tempMotivation });
    setDailyMotivation(tempMotivation);
    setIsEditingMotivation(false);
    toast.success('Frase motivacional atualizada!');
  };

  const cancelEditMotivation = () => {
    setTempMotivation(dailyMotivation);
    setIsEditingMotivation(false);
  };

  const getHabitCompletion = (habitId: string) => {
    return habitCompletions.find(c => c.habitId === habitId);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm capitalize">{todayFormatted}</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard Diário
          </h1>
        </div>

        {/* Debug Info - Aparece apenas quando modo de teste está ativo */}
        {settings?.testsEnabled && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">🔧 Debug - Variáveis de Ambiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                {Object.entries(debugInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-semibold">{key}:</span>
                    <span className={value ? 'text-green-600' : 'text-red-600'}>
                      {value || '❌ NÃO DEFINIDA'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botão de teste de sincronização */}
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex gap-2">
                  <Button
                    onClick={testSync}
                    disabled={isTestingSync}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isTestingSync ? '🧪 Testando...' : '🧪 Testar Sincronização'}
                  </Button>
                  <Button
                    onClick={clearLogs}
                    variant="outline"
                    className="px-4 bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
                  >
                    🗑️ Limpar
                  </Button>
                </div>

                {/* Logs de sincronização */}
                {syncLogs.length > 0 && (
                  <div className="mt-3 p-3 bg-black text-green-400 rounded text-xs font-mono max-h-64 overflow-y-auto">
                    <div className="font-bold mb-2">📋 Logs de Sincronização ({syncLogs.length} mensagens):</div>
                    {syncLogs.map((log, index) => (
                      <div key={index} className="mb-1">{log}</div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Motivational Quote - Full Width */}
        <Card className="gradient-glow border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <Sparkles className="h-5 w-5 text-white flex-shrink-0" />
                {isEditingMotivation ? (
                  <Input
                    value={tempMotivation}
                    onChange={(e) => setTempMotivation(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    placeholder="Digite sua frase motivacional..."
                  />
                ) : (
                  <p className="text-white font-medium flex-1">{dailyMotivation}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {isEditingMotivation ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={saveMotivation}
                      className="text-white hover:bg-white/20"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditMotivation}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingMotivation(true)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={'ghost'}
                      onClick={() => { generateDailyMotivationIfNeeded(); }}
                      className="text-white hover:bg-white/20"
                    >
                      <Sparkles className={'h-4 w-4'} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat - Full Width (container only; AIChat renders its own Card) */}
        {settings?.aiChatEnabled && (
          <div className="h-[34rem] mb-20">
            <AIChat />
          </div>
        )}

        {/* Stats Cards */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hábitos Hoje</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dailyStats?.completedHabits || 0}/{dailyStats?.totalHabits || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dailyStats?.percentage || 0}% concluído
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dailyStats?.earnedPoints || 0}/{dailyStats?.totalPoints || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pontuação do dia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sequência</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...todayHabits.map(h => h.streak), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Maior streak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desempenho</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dailyStats?.percentage || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Performance geral
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Progresso do Dia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hábitos concluídos</span>
                <span>{dailyStats?.percentage || 0}%</span>
              </div>
              <Progress 
                value={dailyStats?.percentage || 0} 
                className="h-3"
              />
              {(dailyStats?.percentage || 0) >= 80 && (
                <p className="text-sm text-green-600 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Excelente desempenho hoje! 🎉</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Habits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Hábitos de Hoje</span>
              <Badge variant="outline">{todayHabits.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayHabits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum hábito configurado para hoje.</p>
                <p className="text-sm">Vá para a aba Hábitos para adicionar novos hábitos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayHabits.map((habit) => {
                  const completion = getHabitCompletion(habit.id);
                  const isCompleted = completion?.status === 'completed';
                  
                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                          : 'bg-background hover:bg-accent/50'
                      }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => toggleHabit(habit.id)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            isCompleted ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {habit.name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(habit.category)} text-white border-0`}
                          >
                            {getCategoryLabel(habit.category)}
                          </Badge>
                          {habit.streak > 0 && (
                            <Badge variant="secondary" className="text-xs ml-2 flex items-center space-x-1">
                              <Flame className="h-3 w-3" />
                              <span>{habit.streak}</span>
                            </Badge>
                          )}
                          {habit.isEssential && (
                            <Badge variant="destructive" className="text-xs">
                              Essencial
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          {habit.time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{habit.time}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Flame className="h-3 w-3" />
                            <span>{habit.streak} dias</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{habit.weight} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default Index;
