import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Brain, 
  Clock, 
  FileText, 
  GraduationCap, 
  Heart, 
  Library, 
  Plus, 
  Quote, 
  Search, 
  Timer, 
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Star,
  Award,
  Bookmark,
  Edit,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Settings,
  Download,
  Upload,
  Filter,
  SortAsc,
  Eye,
  CheckCircle2,
  Clock3,
  Flame,
  BarChart3
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { FlashcardSystem } from '@/components/FlashcardSystem';
import { LibrarySystem } from '@/components/LibrarySystem';
import Pomodoro from '@/components/Pomodoro';
import MiniQuiz from '@/components/MiniQuiz';
import { storage, formatDate } from '@/lib/storage';

const StudyPage = () => {
  const [timeToday, setTimeToday] = useState('0m');
  const [flashcardsDue, setFlashcardsDue] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const loadStats = () => {
      const today = formatDate(new Date());
      const sessions = storage.getPomodoroSessions();

      // Time Today
      const todaySessions = sessions.filter(s => s.date === today);
      const totalToday = todaySessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);
      const hours = Math.floor(totalToday / 60);
      const minutes = totalToday % 60;
      setTimeToday(`${hours}h ${minutes}m`);

      // Flashcards due
      setFlashcardsDue(storage.getDueFlashcards().length);

      // Streak: consecutive days with at least one session ending today
      const datesWithSession = new Set(sessions.map(s => s.date));
      let streakCount = 0;
      const cursor = new Date();
      while (true) {
        const d = formatDate(cursor);
        if (datesWithSession.has(d)) {
          streakCount++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      setStreak(streakCount);

      // XP: simple heuristic: total minutes across all sessions
      const totalAll = sessions.reduce((sum, s) => sum + (s.totalTime || 0), 0);
      setXp(totalAll);
    };

    loadStats();

    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Centro de Estudos
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Desenvolva seu intelecto e expanda seus conhecimentos
            </p>
          </div>
          
          <div className={'flex items-center space-x-2'}>
            <Button className={'gradient-primary text-white border-0'}>
              <Plus className={'h-4 w-4 mr-2'} />
              Novo Conteúdo
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Tempo Hoje</CardTitle>
              <Clock className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'} data-testid="study-time-today">{timeToday}</div>
              <p className={'text-xs text-muted-foreground'}>Tempo estudado hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Flashcards</CardTitle>
              <Brain className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'} data-testid="study-flashcards-due">{flashcardsDue}</div>
              <p className={'text-xs text-muted-foreground'}>Para revisar hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Sequência</CardTitle>
              <Flame className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'} data-testid="study-streak">{streak}</div>
              <p className={'text-xs text-muted-foreground'}>Dias consecutivos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Nível</CardTitle>
              <Trophy className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'} data-testid="study-xp">{xp} XP</div>
              <p className={'text-xs text-muted-foreground'}>XP acumulado</p>
            </CardContent>
          </Card>
        </div>

        {/* Study Sections */}
        <div className={'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
          
          {/* Flashcards */}
          {/* Integrado: FlashcardSystem */}
          <div>
            <FlashcardSystem />
          </div>

          {/* Knowledge Quiz */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <GraduationCap className={'h-5 w-5 text-green-500'} />
                <span>Conhecimentos Gerais</span>
                <Badge variant={'secondary'}>Quiz diário</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <GraduationCap className={'h-12 w-12 mx-auto text-green-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Quiz Inteligente de Conhecimentos</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades Planejadas:</strong><br/>
                    • <strong>Quiz Diário Personalizado:</strong> 10-20 perguntas adaptadas ao seu nível e interesses<br/>
                    • <strong>Categorias Diversas:</strong> História Mundial, Ciências, Geografia, Atualidades, Arte, Literatura, Tecnologia<br/>
                    • <strong>Níveis de Dificuldade:</strong> Iniciante, Intermediário, Avançado, Expert com progressão automática<br/>
                    • <strong>Banco de Perguntas Expansível:</strong> +10.000 perguntas atualizadas constantemente<br/>
                    • <strong>Sistema de Pontuação:</strong> Pontos por acerto, bônus por sequência, multiplicadores especiais<br/>
                    • <strong>Ranking Pessoal:</strong> Acompanhe sua evolução mensal e anual<br/>
                    • <strong>Explicações Detalhadas:</strong> Cada resposta vem com explicação educativa e links para aprofundamento<br/>
                    • <strong>Desafios Especiais:</strong> Temas da semana, quiz de efemérides, desafios relâmpago<br/>
                    • <strong>Modo Competitivo:</strong> Compare-se com outros usuários (opcional)<br/>
                    • <strong>Certificados:</strong> Conquiste certificados por domínio em áreas específicas<br/>
                    • <strong>Revisão Inteligente:</strong> Sistema revisa tópicos onde você teve mais dificuldade
                  </p>
                </div>
              </div>              <div className={'space-y-4'}>
                <MiniQuiz />
              </div>              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <Play className={'h-4 w-4 mr-2'} />
                  Quiz Hoje
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <BarChart3 className={'h-4 w-4 mr-2'} />
                  Estatísticas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Library */}
          {/* Integrado: LibrarySystem */}
          <div>
            <LibrarySystem />
          </div>

          {/* Vocabulary Builder */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <FileText className={'h-5 w-5 text-orange-500'} />
                <span>Vocabulário</span>
                <Badge variant={'secondary'}>156 palavras</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <FileText className={'h-12 w-12 mx-auto text-orange-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Construtor de Vocabulário Avançado</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades Planejadas:</strong><br/>
                    • <strong>Palavra do Dia:</strong> Nova palavra diariamente com definição, etimologia e exemplos<br/>
                    • <strong>Múltiplos Idiomas:</strong> Português, Inglês, Espanhol, Francês com traduções cruzadas<br/>
                    • <strong>Contexto Inteligente:</strong> Exemplos de uso em frases reais, sinônimos e antônimos<br/>
                    • <strong>Níveis de Domínio:</strong> Marque palavras como Aprendendo, Conhecido, Dominado<br/>
                    • <strong>Revisão Espaçada:</strong> Sistema inteligente para revisar palavras esquecidas<br/>
                    • <strong>Categorias Temáticas:</strong> Organize por temas (Negócios, Acadêmico, Cotidiano, Técnico)<br/>
                    • <strong>Pronúncia Audio:</strong> Áudio nativo para aprender pronúncia correta<br/>
                    • <strong>Jogos de Vocabulário:</strong> Quiz, caça-palavras, associação, completar frases<br/>
                    • <strong>Estatísticas Detalhadas:</strong> Palavras aprendidas por mês, taxa de retenção, progresso por idioma<br/>
                    • <strong>Flashcards Integrados:</strong> Converta palavras em flashcards automaticamente<br/>
                    • <strong>Importação de Textos:</strong> Extraia palavras desconhecidas de textos que você lê<br/>
                    • <strong>Metas Personalizadas:</strong> Defina quantas palavras quer aprender por semana/mês
                  </p>
                </div>
              </div>
              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <Plus className={'h-4 w-4 mr-2'} />
                  Nova Palavra
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <RotateCcw className={'h-4 w-4 mr-2'} />
                  Revisar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Courses & Certifications */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Award className={'h-5 w-5 text-yellow-500'} />
                <span>Cursos & Certificações</span>
                <Badge variant={'secondary'}>3 ativos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <Award className={'h-12 w-12 mx-auto text-yellow-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Gerenciador de Cursos Profissional</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades Planejadas:</strong><br/>
                    • <strong>Tracking Completo:</strong> Acompanhe progresso por módulo, aula, exercício e projeto<br/>
                    • <strong>Múltiplas Plataformas:</strong> Integração com Coursera, Udemy, Khan Academy, YouTube<br/>
                    • <strong>Cronograma Inteligente:</strong> IA sugere horários de estudo baseado na sua rotina<br/>
                    • <strong>Certificados Digitais:</strong> Galeria de certificados conquistados com validação<br/>
                    • <strong>Metas de Conclusão:</strong> Defina prazos realistas com lembretes automáticos<br/>
                    • <strong>Notas por Aula:</strong> Sistema de anotações sincronizado com timestamps de vídeo<br/>
                    • <strong>Projetos Práticos:</strong> Organize e acompanhe projetos de cada curso<br/>
                    • <strong>Networking:</strong> Conecte-se com outros estudantes dos mesmos cursos<br/>
                    • <strong>Avaliação de ROI:</strong> Calcule retorno do investimento em educação<br/>
                    • <strong>Playlist Personalizada:</strong> Crie sequências de aprendizado customizadas<br/>
                    • <strong>Relatórios de Progresso:</strong> Dashboards com tempo investido, skills adquiridas<br/>
                    • <strong>Recomendações:</strong> Sugestões de próximos cursos baseado no seu perfil
                  </p>
                </div>
              </div>
              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <Play className={'h-4 w-4 mr-2'} />
                  Continuar
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <Plus className={'h-4 w-4 mr-2'} />
                  Novo Curso
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Timer */}
          {/* Integrado: Pomodoro */}
          <div>
            <Pomodoro />
          </div>

          {/* Study Notes */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Edit className={'h-5 w-5 text-indigo-500'} />
                <span>Notas de Estudo</span>
                <Badge variant={'secondary'}>24 notas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <Edit className={'h-12 w-12 mx-auto text-indigo-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Sistema de Notas Inteligente</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades Planejadas:</strong><br/>
                    • <strong>Editor Rico:</strong> Markdown, LaTeX para fórmulas, desenhos, tabelas, código<br/>
                    • <strong>Organização Hierárquica:</strong> Pastas, subpastas, tags coloridas, favoritos<br/>
                    • <strong>Busca Avançada:</strong> Busca por conteúdo, tags, data, tipo de arquivo<br/>
                    • <strong>Templates Inteligentes:</strong> Modelos para diferentes tipos de estudo (resumos, mapas mentais)<br/>
                    • <strong>Sincronização em Tempo Real:</strong> Acesse de qualquer dispositivo, backup automático<br/>
                    • <strong>Colaboração:</strong> Compartilhe notas, edição colaborativa, comentários<br/>
                    • <strong>Anexos Multimídia:</strong> Imagens, áudios, vídeos, PDFs integrados<br/>
                    • <strong>Versioning:</strong> Histórico de alterações, restauração de versões anteriores<br/>
                    • <strong>Exportação Flexível:</strong> PDF, Word, HTML, Markdown com formatação<br/>
                    • <strong>OCR Integrado:</strong> Extraia texto de imagens e PDFs automaticamente<br/>
                    • <strong>Links Inteligentes:</strong> Conecte notas relacionadas, crie redes de conhecimento<br/>
                    • <strong>Modo Apresentação:</strong> Transforme notas em slides para revisão
                  </p>
                </div>
              </div>
              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <Plus className={'h-4 w-4 mr-2'} />
                  Nova Nota
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <Search className={'h-4 w-4 mr-2'} />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inspirational Quotes */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Quote className={'h-5 w-5 text-pink-500'} />
                <span>Citações Inspiradoras</span>
                <Badge variant={'secondary'}>89 salvas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <Quote className={'h-12 w-12 mx-auto text-pink-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Biblioteca de Sabedoria</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades Planejadas:</strong><br/>
                    • <strong>Citação do Dia:</strong> Frase inspiradora diária com contexto histórico<br/>
                    • <strong>Coleção Pessoal:</strong> Salve suas citações favoritas com tags personalizadas<br/>
                    • <strong>Categorias Temáticas:</strong> Sucesso, Sabedoria, Motivação, Amor, Filosofia, Ciência<br/>
                    • <strong>Autores Famosos:</strong> Biblioteca com milhares de citações de grandes pensadores<br/>
                    • <strong>Busca Inteligente:</strong> Encontre citações por tema, autor, palavra-chave, sentimento<br/>
                    • <strong>Compartilhamento Social:</strong> Crie cards visuais para redes sociais<br/>
                    • <strong>Reflexões Pessoais:</strong> Adicione suas próprias interpretações e pensamentos<br/>
                    • <strong>Modo Meditação:</strong> Contemple uma citação por alguns minutos diariamente<br/>
                    • <strong>Wallpapers Personalizados:</strong> Transforme citações em papéis de parede<br/>
                    • <strong>Lembretes Motivacionais:</strong> Receba citações em momentos específicos do dia<br/>
                    • <strong>Análise de Humor:</strong> IA sugere citações baseadas no seu estado emocional<br/>
                    • <strong>Histórico de Favoritas:</strong> Veja como suas preferências evoluem ao longo do tempo
                  </p>
                </div>
              </div>
              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <Heart className={'h-4 w-4 mr-2'} />
                  Favoritas
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <Zap className={'h-4 w-4 mr-2'} />
                  Inspirar-me
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <BarChart3 className={'h-5 w-5'} />
              <span>Dashboard de Estudos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
              <BarChart3 className={'h-12 w-12 mx-auto text-primary opacity-50'} />
              <div className={'space-y-2'}>
                <h3 className={'text-lg font-semibold'}>Central de Inteligência dos Estudos</h3>
                <p className={'text-sm text-muted-foreground leading-relaxed'}>
                  <strong>Funcionalidades do Dashboard:</strong><br/>
                  • <strong>Visão 360°:</strong> Tempo total estudado, sessões completadas, streak atual, XP ganho<br/>
                  • <strong>Gráficos Interativos:</strong> Progresso semanal/mensal, distribuição por matéria, horários mais produtivos<br/>
                  • <strong>Metas Visuais:</strong> Progresso das metas com barras coloridas e percentuais<br/>
                  • <strong>Conquistas Recentes:</strong> Badges desbloqueados, recordes batidos, marcos alcançados<br/>
                  • <strong>Próximas Ações:</strong> Flashcards para revisar, deadlines próximos, sessões agendadas<br/>
                  • <strong>Análise de Performance:</strong> Identificação de pontos fortes e áreas para melhoria<br/>
                  • <strong>Comparativo Temporal:</strong> Compare performance atual com períodos anteriores<br/>
                  • <strong>Recomendações IA:</strong> Sugestões personalizadas para otimizar seus estudos<br/>
                  • <strong>Integração Total:</strong> Dados de todas as seções unificados em uma visão clara<br/>
                  • <strong>Exportação de Relatórios:</strong> Gere relatórios detalhados para acompanhamento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudyPage;