import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { 
  Home, 
  CheckSquare, 
  Dumbbell, 
  User, 
  BookOpen, 
  Target, 
  BarChart3,
  Settings,
  GraduationCap,
  Camera,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Habitos', href: '/habits', icon: CheckSquare },
  { name: 'Treino', href: '/training', icon: Dumbbell },
  { name: 'Corpo', href: '/body', icon: User },
  { name: 'Diario', href: '/journal', icon: BookOpen },
  { name: 'Metas', href: '/goals', icon: Target },
  { name: 'Estudos', href: '/study', icon: GraduationCap },
  { name: 'Cursos', href: '/courses', icon: GraduationCap },
  { name: 'Finanças', href: '/finance', icon: BarChart3 },
  { name: 'Vocabulário', href: '/vocabulary', icon: BookOpen },
  { name: 'Quiz', href: '/quiz', icon: GraduationCap },
  { name: 'Registros', href: '/records', icon: Camera },
  { name: 'Estatisticas', href: '/stats', icon: BarChart3 },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const update = () => setDueCount(storage.getDueVocabularyCount());
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <div className={'md:hidden fixed top-4 left-4 z-50'}>
        <Button
          variant={'outline'}
          size={'icon'}
          onClick={() => setIsOpen(!isOpen)}
          className={'bg-background/80 backdrop-blur-sm'}
        >
          {isOpen ? <X className={'h-4 w-4'} /> : <Menu className={'h-4 w-4'} />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-background/95 backdrop-blur-sm border-r transform transition-transform duration-300 ease-in-out md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className={'flex flex-col h-full'}>
          {/* Header */}
          <div className={'p-6 border-b'}>
            <div className={'flex items-center space-x-2'}>
              <div className={'w-8 h-8 gradient-primary rounded-lg flex items-center justify-center'}>
                <Sparkles className={'h-4 w-4 text-white'} />
              </div>
              <div>
                <h1 className={'text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
                  Glow Up
                </h1>
                <p className={'text-xs text-muted-foreground'}>Organizador 2026</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={'flex-1 p-4 space-y-2'}>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className={'h-4 w-4'} />
                  <span>{item.name}</span>
                  {item.name === 'Vocabulário' && dueCount > 0 && (
                    <Badge variant={'destructive'} className={'ml-auto text-xs'}>
                      {dueCount}
                    </Badge>
                  )}
                  {isActive && (
                    <Badge variant={'secondary'} className={'ml-auto text-xs'}>
                      Ativo
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={'p-4 border-t'}>
            <div className={'text-center'}>
              <p className={'text-xs text-muted-foreground mb-2'}>
                Versao 1.0.0
              </p>
              <div className={'gradient-glow rounded-lg p-3'}>
                <p className={'text-xs text-white font-medium'}>
                  🎯 Meta 2026: Glow Up Completo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className={'fixed inset-0 bg-black/20 z-30 md:hidden'}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}