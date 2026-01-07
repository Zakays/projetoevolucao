import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { UserSettings } from '@/types';
import { toast } from 'sonner';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
  Minimize2,
  Maximize2,
  Bell,
  BellOff,
  Download,
  Upload,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tempMotivation, setTempMotivation] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = storage.getSettings();
    setSettings(currentSettings);
    setTempMotivation(currentSettings.dailyMotivation);
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storage.updateSettings({ [key]: value });
    
    // Aplicar tema imediatamente
    if (key === 'theme') {
      applyTheme(value);
    }
    
    toast.success('Configuração atualizada!');
  };

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    if (!settings) return;
    
    const newNotifications = { ...settings.notifications, [key]: value };
    const newSettings = { ...settings, notifications: newNotifications };
    setSettings(newSettings);
    storage.updateSettings({ notifications: newNotifications });
    toast.success('Notificação atualizada!');
  };

  const saveDailyMotivation = () => {
    if (!settings) return;
    
    updateSetting('dailyMotivation', tempMotivation);
    toast.success('Frase motivacional atualizada!');
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const exportData = () => {
    try {
      const data = storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glow-up-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = storage.importData(jsonData);
        
        if (success) {
          toast.success('Dados importados com sucesso!');
          loadSettings();
          // Recarregar a página para aplicar todas as mudanças
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error('Erro ao importar dados - arquivo inválido');
        }
      } catch (error) {
        toast.error('Erro ao ler arquivo');
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita!')) {
      localStorage.removeItem('glow-up-organizer-data');
      toast.success('Dados resetados com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      default: return Monitor;
    }
  };

  if (!settings) {
    return (
      <Layout>
        <div className={'flex items-center justify-center min-h-[400px]'}>
          <div className={'text-center'}>
            <Settings className={'h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse'} />
            <p>Carregando configurações...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div>
          <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
            Configurações
          </h1>
          <p className={'text-muted-foreground mt-1'}>
            Personalize sua experiência no organizador
          </p>
        </div>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Monitor className={'h-5 w-5'} />
              <span>Aparência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={'space-y-6'}>
            {/* Tema */}
            <div className={'space-y-2'}>
              <Label>Tema</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
              >
                <SelectTrigger className={'w-full'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'light'}>
                    <div className={'flex items-center space-x-2'}>
                      <Sun className={'h-4 w-4'} />
                      <span>Claro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={'dark'}>
                    <div className={'flex items-center space-x-2'}>
                      <Moon className={'h-4 w-4'} />
                      <span>Escuro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={'system'}>
                    <div className={'flex items-center space-x-2'}>
                      <Monitor className={'h-4 w-4'} />
                      <span>Sistema</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modo Minimalista */}
            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label className={'flex items-center space-x-2'}>
                  {settings.minimalMode ? <Minimize2 className={'h-4 w-4'} /> : <Maximize2 className={'h-4 w-4'} />}
                  <span>Modo Minimalista</span>
                </Label>
                <p className={'text-sm text-muted-foreground'}>
                  Interface mais limpa com menos elementos visuais
                </p>
              </div>
              <Switch
                checked={settings.minimalMode}
                onCheckedChange={(checked) => updateSetting('minimalMode', checked)}
              />
            </div>

            {/* Animações */}
            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label className={'flex items-center space-x-2'}>
                  {settings.animationsEnabled ? <Zap className={'h-4 w-4'} /> : <ZapOff className={'h-4 w-4'} />}
                  <span>Animações</span>
                </Label>
                <p className={'text-sm text-muted-foreground'}>
                  Ativar animações e transições suaves
                </p>
              </div>
              <Switch
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => updateSetting('animationsEnabled', checked)}
              />
            </div>

            {/* Sons */}
            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label className={'flex items-center space-x-2'}>
                  {settings.soundEnabled ? <Volume2 className={'h-4 w-4'} /> : <VolumeX className={'h-4 w-4'} />}
                  <span>Sons</span>
                </Label>
                <p className={'text-sm text-muted-foreground'}>
                  Sons de feedback ao completar hábitos
                </p>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Motivação */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Sparkles className={'h-5 w-5'} />
              <span>Motivação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={'space-y-4'}>
            <div className={'space-y-2'}>
              <Label htmlFor={'motivation'}>Frase Motivacional Diária</Label>
              <Textarea
                id={'motivation'}
                value={tempMotivation}
                onChange={(e) => setTempMotivation(e.target.value)}
                placeholder={'Digite sua frase motivacional...'}
                rows={3}
              />
              <div className={'grid grid-cols-1 md:grid-cols-2 gap-2'}>
                <div>
                  <Label>Tom da frase</Label>
                  <select className={'w-full'} value={settings.motivationTone || 'encorajador'} onChange={e => updateSetting('motivationTone', e.target.value)}>
                    <option value={'encorajador'}>Encorajador</option>
                    <option value={'calmo'}>Calmo</option>
                    <option value={'direto'}>Direto</option>
                    <option value={'personal'}>Personal</option>
                  </select>
                </div>
                <div>
                  <Label>Comprimento</Label>
                  <select className={'w-full'} value={settings.motivationLength || 'short'} onChange={e => updateSetting('motivationLength', e.target.value)}>
                    <option value={'short'}>Curta</option>
                    <option value={'medium'}>Média</option>
                    <option value={'long'}>Longa</option>
                  </select>
                </div>
              </div>

              <div className={'mt-2 flex items-center space-x-2'}>
                <Button 
                  onClick={saveDailyMotivation}
                  className={'gradient-primary text-white border-0'}
                  disabled={tempMotivation === settings.dailyMotivation}
                >
                  Salvar Frase
                </Button>
                <Button variant={'ghost'} onClick={() => { storage.updateSettings({ motivationTone: 'encorajador', motivationLength: 'short' }); toast.success('Preferências de motivação restauradas'); }}>Restaurar padrão</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Bell className={'h-5 w-5'} />
              <span>Notificações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={'space-y-4'}>
            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label>Lembretes de Hábitos</Label>
                <p className={'text-sm text-muted-foreground'}>
                  Notificações para lembrar de completar hábitos
                </p>
              </div>
              <Switch
                checked={settings.notifications.habitReminders}
                onCheckedChange={(checked) => updateNotificationSetting('habitReminders', checked)}
              />
            </div>

            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label>Lembretes de Treino</Label>
                <p className={'text-sm text-muted-foreground'}>
                  Notificações para lembrar de registrar treinos
                </p>
              </div>
              <Switch
                checked={settings.notifications.workoutReminders}
                onCheckedChange={(checked) => updateNotificationSetting('workoutReminders', checked)}
              />
            </div>

            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label>Lembretes de Reflexão</Label>
                <p className={'text-sm text-muted-foreground'}>
                  Notificações para lembrar de fazer reflexões diárias
                </p>
              </div>
              <Switch
                checked={settings.notifications.journalReminders}
                onCheckedChange={(checked) => updateNotificationSetting('journalReminders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Testes */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Zap className={'h-5 w-5'} />
              <span>Testes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label>Mostrar opções de teste</Label>
                <p className={'text-sm text-muted-foreground'}>
                  Habilita botões e utilitários para testes e simulações (somente para desenvolvimento)
                </p>
              </div>
              <Switch
                checked={!!settings.testsEnabled}
                onCheckedChange={(checked) => updateSetting('testsEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* IA */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Sparkles className={'h-5 w-5'} />
              <span>Integração IA</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={'space-y-4'}>
            <div className={'flex items-center justify-between'}>
              <div className={'space-y-0.5'}>
                <Label>Ativar Chat com IA</Label>
                <p className={'text-sm text-muted-foreground'}>Habilita ou desabilita o componente de chat com IA em todo o app</p>
              </div>
              <Switch checked={!!settings.aiChatEnabled} onCheckedChange={(checked) => updateSetting('aiChatEnabled' as any, checked)} />
            </div>
            <div className={'space-y-2'}>
              <Label htmlFor={'aiKeys'}>Lista de API Keys (uma por linha)</Label>
              <Textarea id={'aiKeys'} value={(settings.aiApiKeys || []).join('\n')} onChange={(e) => {
                const lines = (e.target.value || '').split('\n').map(l => l.trim()).filter(Boolean);
                updateSetting('aiApiKeys' as any, lines);
              }} placeholder={'sk-...'} rows={4} />
              <p className={'text-sm text-muted-foreground'}>
                As chaves são salvas localmente no navegador. Quando uma chave atingir o limite/quota ela será removida automaticamente da lista. Se preferir, adicione apenas uma chave nesta lista (uma por linha).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dados */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Download className={'h-5 w-5'} />
              <span>Gerenciar Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={'space-y-4'}>
            <div className={'grid grid-cols-1 md:grid-cols-2 gap-4'}>
              {/* Exportar */}
              <div className={'space-y-2'}>
                <Label>Exportar Dados</Label>
                <p className={'text-sm text-muted-foreground mb-2'}>
                  Baixe um backup de todos os seus dados
                </p>
                <Button 
                  onClick={exportData}
                  variant={'outline'}
                  className={'w-full'}
                >
                  <Download className={'h-4 w-4 mr-2'} />
                  Exportar Backup
                </Button>
              </div>

              {/* Importar */}
              <div className={'space-y-2'}>
                <Label>Importar Dados</Label>
                <p className={'text-sm text-muted-foreground mb-2'}>
                  Restaure dados de um backup anterior
                </p>
                <div className={'relative'}>
                  <Input
                    type={'file'}
                    accept={'.json'}
                    onChange={importData}
                    className={'absolute inset-0 opacity-0 cursor-pointer'}
                  />
                  <Button variant={'outline'} className={'w-full pointer-events-none'}>
                    <Upload className={'h-4 w-4 mr-2'} />
                    Importar Backup
                  </Button>
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className={'pt-4 border-t'}>
              <div className={'space-y-2'}>
                <Label className={'text-destructive'}>Zona de Perigo</Label>
                <p className={'text-sm text-muted-foreground mb-2'}>
                  Resetar todos os dados permanentemente
                </p>
                <Button 
                  onClick={resetAllData}
                  variant={'destructive'}
                  className={'w-full md:w-auto'}
                >
                  <RotateCcw className={'h-4 w-4 mr-2'} />
                  Resetar Todos os Dados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Aplicativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={'space-y-2 text-sm text-muted-foreground'}>
              <p><strong>Versão:</strong> 1.0.0</p>
              <p><strong>Desenvolvido para:</strong> Organização pessoal e evolução</p>
              <p><strong>Armazenamento:</strong> Local (navegador)</p>
              <p><strong>Objetivo:</strong> Glow Up 2026 🎯</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;