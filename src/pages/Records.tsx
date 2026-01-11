import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Video, 
  Image, 
  Upload, 
  Calendar, 
  Tag, 
  Filter, 
  Grid3X3, 
  List, 
  Search, 
  Download, 
  Share2, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Eye, 
  Clock, 
  MapPin, 
  Smile, 
  TrendingUp, 
  Award, 
  Zap, 
  Star, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  BarChart3, 
  Target, 
  Flame, 
  Trophy, 
  Users, 
  Lock, 
  Globe, 
  Settings, 
  Folder, 
  Archive, 
  RefreshCw,
  Sparkles,
  Camera as CameraIcon,
  FileImage,
  FileVideo,
  Mic,
  FileText,
  Link,
  Hash,
  Calendar as CalendarIcon,
  Clock3,
  MapPin as LocationIcon
} from 'lucide-react';

import UploadArea from '@/components/UploadArea';
import Gallery from '@/components/Gallery';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/storage';
import { computeRecordsStats } from '@/lib/analytics';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';

const RecordsPage = () => {
  const [totalFiles, setTotalFiles] = useState(0);
  const [daysRegistered, setDaysRegistered] = useState(0);
  const [visualMilestones, setVisualMilestones] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentCategoryRef = useRef<string>('uploads');

  const loadStats = () => {
    const files = storage.getUploadedFiles();
    setRecordsFiles(files);

    // Use helper to compute derived stats
    const { totalFiles, daysRegistered, visualMilestones, progressPercent } = computeRecordsStats(files);
    setTotalFiles(totalFiles);
    setDaysRegistered(daysRegistered);
    setVisualMilestones(visualMilestones);
    setProgressPercent(progressPercent);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleQuickAction = (category: string) => {
    // Open UploadArea's file input so user can set description/category before sending
    const uploadEl = document.getElementById('upload-input') as HTMLInputElement | null;
    if (uploadEl) uploadEl.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    try {
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        const reader = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = reject;
          r.readAsDataURL(file);
        });

        const uploaded: Omit<any, 'id' | 'uploadDate'> = {
          filename: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          tags: [],
          category: currentCategoryRef.current || 'uploads',
          description: '',
          previewUrl: reader,
          metadata: {},
        };

        storage.addUploadedFile(uploaded as any);
      }

      toast.success('Arquivo(s) enviados');
      loadStats();
      setRecordsFiles(storage.getUploadedFiles());
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar arquivo(s)');
    }
  };

  const [recordsFiles, setRecordsFiles] = useState<UploadedFile[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<UploadedFile | null>(null);

  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | undefined>(undefined);

  const openItem = async (item: UploadedFile) => {
    setSelectedItem(item);
    // fetch blob URL from storage (idb)
    try {
      const url = await storage.getUploadPreviewUrl(item.id);
      setSelectedPreviewUrl(url);
    } catch (err) {
      console.error(err);
      setSelectedPreviewUrl(undefined);
    }
  };

  const closeItem = () => {
    // revoke object URL if present (with fallback for test env)
    if (selectedPreviewUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(selectedPreviewUrl);
      } catch (e) {
        // Ignore if URL revocation not available (test env)
      }
    }
    setSelectedPreviewUrl(undefined);
    setSelectedItem(null);
  };

  const saveDescription = (id: string, description: string) => {
    const ok = storage.updateUploadedFile(id, { description });
    if (ok) {
      toast.success('Descrição salva');
      const updated = storage.getUploadedFiles();
      setRecordsFiles(updated);
      loadStats();
      setSelectedItem(updated.find(f => f.id === id) || null);
    } else {
      toast.error('Erro ao salvar descrição');
    }
  };

  const removeRecord = (id: string) => {
    if (!confirm('Excluir arquivo?')) return;
    const ok = storage.deleteUploadedFile(id);
    if (ok) {
      toast.success('Arquivo excluído');
      const updated = storage.getUploadedFiles();
      setRecordsFiles(updated);
      loadStats();
      closeItem();
    } else {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Registros de Evolução
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Documente sua jornada de transformação com fotos, vídeos e momentos especiais
            </p>
          </div>
          
          <div className={'flex items-center space-x-2'}>
            <Button variant={'outline'}>
              <Grid3X3 className={'h-4 w-4 mr-2'} />
              Grade
            </Button>
            <Button className={'gradient-primary text-white border-0'} onClick={() => handleQuickAction('uploads')}>
              <Upload className={'h-4 w-4 mr-2'} />
              Novo Registro
            </Button>
          </div>
        </div>
        {/* Item Preview Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-background rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-auto p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:flex-1">
                  {selectedItem.type.startsWith('image/') ? (
                    <img src={selectedPreviewUrl || selectedItem.previewUrl} alt={selectedItem.originalName} className="max-h-[70vh] w-auto h-auto object-contain rounded" />
                  ) : selectedItem.type.startsWith('video/') ? (
                    <video src={selectedPreviewUrl || selectedItem.previewUrl} controls className="max-h-[70vh] w-auto h-auto object-contain rounded" />
                  ) : (
                    <div className="p-8">Preview não disponível</div>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">{(selectedItem.uploadDate || '').substring(0,10)}</div>
                </div>
                <div className="md:flex-1">
                  <h3 className="text-lg font-semibold">{selectedItem.originalName}</h3>
                  <textarea defaultValue={selectedItem.description || ''} id="records-description" className="w-full h-48 mt-2 p-2 border rounded" />
                  <div className="flex space-x-2 mt-3">
                    <Button onClick={() => {
                      const el = document.getElementById('records-description') as HTMLTextAreaElement | null;
                      if (el) saveDescription(selectedItem.id, el.value);
                    }} className="gradient-primary text-white border-0">Salvar</Button>
                    <Button variant="outline" onClick={() => removeRecord(selectedItem.id)}>Excluir</Button>
                    <Button variant="ghost" onClick={() => closeItem()}>Fechar</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Total de Registros</CardTitle>
              <Camera className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{totalFiles}</div>
              <p className={'text-xs text-muted-foreground'}>+12 esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Dias Registrados</CardTitle>
              <Calendar className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{daysRegistered}</div>
              <p className={'text-xs text-muted-foreground'}>Sequência: 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Marcos Visuais</CardTitle>
              <Trophy className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{visualMilestones}</div>
              <p className={'text-xs text-muted-foreground'}>Transformações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
              <CardTitle className={'text-sm font-medium'}>Progresso Geral</CardTitle>
              <TrendingUp className={'h-4 w-4 text-muted-foreground'} />
            </CardHeader>
            <CardContent>
              <div className={'text-2xl font-bold'}>{progressPercent}%</div>
              <p className={'text-xs text-muted-foreground'}>Meta 2026</p>
              <div className={'mt-2'}>
                <Progress value={progressPercent} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className={'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
          
          {/* Upload Section */}
          <Card className={'lg:col-span-1 hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Upload className={'h-5 w-5 text-blue-500'} />
                <span>Central de Upload</span>
                <Badge variant={'secondary'}>Múltiplos formatos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <UploadArea />
              <input type="file" multiple ref={fileInputRef} onChange={handleFilesSelected} className="hidden" data-testid="records-file-input" />
            </CardContent>
          </Card>

          {/* Gallery Area (replaces Ações Rápidas) */}
          <Card className={'lg:col-span-2 hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Grid3X3 className={'h-5 w-5 text-yellow-500'} />
                <span>Galeria Rápida</span>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-3'}>
              <div className={'flex items-center space-x-2'}>
                <select value={galleryFilter} onChange={(e) => setGalleryFilter(e.target.value)} className="p-2 border rounded-md bg-background">
                  <option value="all">Todos</option>
                  <option value="images">Imagens</option>
                  <option value="videos">Vídeos</option>
                  <option value="selfie">Selfie de Progresso</option>
                  <option value="video-treino">Vídeo de Treino</option>
                  <option value="before-after">Before & After</option>
                  <option value="marco-especial">Marco Especial</option>
                  <option value="progresso-mensal">Progresso Mensal</option>
                  <option value="uploads">Uploads</option>
                </select>
                <Input placeholder="Buscar..." value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} className="flex-1" />
                <Button variant="outline" onClick={() => { setRecordsFiles(storage.getUploadedFiles()); setGallerySearch(''); setGalleryFilter('all'); }}>Atualizar</Button>
              </div>

              <div className={'grid grid-cols-2 md:grid-cols-3 gap-3 mt-3'}>
                {recordsFiles
                  .filter(f => {
                    if (galleryFilter === 'all') return true;
                    if (galleryFilter === 'images') return f.type.startsWith('image/');
                    if (galleryFilter === 'videos') return f.type.startsWith('video/');
                    return f.category === galleryFilter;
                  })
                  .filter(f => gallerySearch === '' || f.originalName.toLowerCase().includes(gallerySearch.toLowerCase()) || (f.description || '').toLowerCase().includes(gallerySearch.toLowerCase()))
                  .map(file => (
                    <div key={file.id} className={'border rounded-lg p-2 relative cursor-pointer'} onClick={() => openItem(file)} data-testid={`records-item-${file.id}`}>
                      <div className={'h-36 flex items-center justify-center overflow-hidden bg-muted/50 rounded'}>
                        {file.type.startsWith('image/') ? (
                          <img src={file.previewUrl || ''} alt={file.originalName} className={'object-cover h-full w-full'} />
                        ) : file.type.startsWith('video/') ? (
                          <video src={file.previewUrl || ''} className={'h-full w-full'} />
                        ) : (
                          <div className={'flex items-center space-x-2'}>
                            <FileText />
                            <div className={'text-xs'}>{file.originalName}</div>
                          </div>
                        )}
                      </div>

                      <div className={'mt-2 text-xs'}>
                        <div className={'font-medium truncate'}>{file.originalName}</div>
                        <div className={'text-muted-foreground text-xs'}>{(file.uploadDate || '').substring(0, 10)}</div>
                        <div className={'text-muted-foreground text-xs truncate'}>{file.description || ''}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Features */}
        <div className={'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
          
          {/* Smart Gallery */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Grid3X3 className={'h-5 w-5 text-purple-500'} />
                <span>Galeria Inteligente</span>
                <Badge variant={'secondary'}>IA Powered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <Grid3X3 className={'h-12 w-12 mx-auto text-purple-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Galeria com Inteligência Artificial</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades da Galeria:</strong><br/>
                    • <strong>Organização Automática:</strong> IA categoriza por tipo (treino, alimentação, selfies, marcos)<br/>
                    • <strong>Timeline Inteligente:</strong> Visualização cronológica com marcos importantes destacados<br/>
                    • <strong>Busca Visual:</strong> Encontre fotos por conteúdo, cores, pessoas, objetos<br/>
                    • <strong>Álbuns Dinâmicos:</strong> Criação automática de álbuns por período, evento, progresso<br/>
                    • <strong>Comparações Visuais:</strong> Before/After automático com slider interativo<br/>
                    • <strong>Detecção de Progresso:</strong> IA identifica mudanças físicas ao longo do tempo<br/>
                    • <strong>Mosaicos Personalizados:</strong> Crie colagens automáticas de sua evolução<br/>
                    • <strong>Filtros Avançados:</strong> Por data, tipo, humor, localização, pessoas<br/>
                    • <strong>Modo Apresentação:</strong> Slideshow automático com música de fundo<br/>
                    • <strong>Compartilhamento Inteligente:</strong> Crie stories e posts otimizados para redes sociais<br/>
                    • <strong>Backup Inteligente:</strong> Sincronização automática com múltiplos serviços<br/>
                    • <strong>Reconhecimento Facial:</strong> Organize fotos por pessoas automaticamente
                  </p>
                </div>
              </div>
              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <Eye className={'h-4 w-4 mr-2'} />
                  Visualizar
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <Filter className={'h-4 w-4 mr-2'} />
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card className={'hover:shadow-lg transition-shadow'}>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <TrendingUp className={'h-5 w-5 text-green-500'} />
                <span>Tracking de Progresso</span>
                <Badge variant={'secondary'}>Análise Visual</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={'space-y-4'}>
              <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
                <TrendingUp className={'h-12 w-12 mx-auto text-green-500 opacity-50'} />
                <div className={'space-y-2'}>
                  <h3 className={'text-lg font-semibold'}>Análise Visual de Progresso</h3>
                  <p className={'text-sm text-muted-foreground leading-relaxed'}>
                    <strong>Funcionalidades de Análise:</strong><br/>
                    • <strong>Detecção de Mudanças:</strong> IA analisa diferenças físicas entre fotos ao longo do tempo<br/>
                    • <strong>Métricas Visuais:</strong> Gráficos de evolução baseados em análise de imagem<br/>
                    • <strong>Marcos Automáticos:</strong> Sistema detecta e celebra transformações significativas<br/>
                    • <strong>Comparações Temporais:</strong> Compare fotos de diferentes períodos lado a lado<br/>
                    • <strong>Análise de Postura:</strong> Acompanhe melhorias na postura corporal<br/>
                    • <strong>Tracking de Expressões:</strong> Monitore mudanças na confiança e felicidade<br/>
                    • <strong>Relatórios Visuais:</strong> Gere relatórios automáticos de sua evolução<br/>
                    • <strong>Predições IA:</strong> Projeções de como você pode estar no futuro<br/>
                    • <strong>Análise de Consistência:</strong> Identifique padrões em sua jornada<br/>
                    • <strong>Celebração de Conquistas:</strong> Destaque automaticamente momentos especiais<br/>
                    • <strong>Compartilhamento de Progresso:</strong> Crie posts motivacionais de sua evolução<br/>
                    • <strong>Insights Personalizados:</strong> Recomendações baseadas em sua jornada visual
                  </p>
                </div>
              </div>
              <div className={'flex space-x-2'}>
                <Button className={'flex-1'} variant={'outline'}>
                  <BarChart3 className={'h-4 w-4 mr-2'} />
                  Analisar
                </Button>
                <Button className={'flex-1'} variant={'outline'}>
                  <Award className={'h-4 w-4 mr-2'} />
                  Marcos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Removed Social Features and Advanced Features per user request */}
        </div>

        {/* Content Organization */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <Folder className={'h-5 w-5'} />
              <span>Organização de Conteúdo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={'bg-muted/50 p-6 rounded-lg text-center space-y-4'}>
              <Folder className={'h-12 w-12 mx-auto text-primary opacity-50'} />
              <div className={'space-y-2'}>
                <h3 className={'text-lg font-semibold'}>Sistema de Organização Inteligente</h3>
                <p className={'text-sm text-muted-foreground leading-relaxed'}>
                  <strong>Funcionalidades de Organização:</strong><br/>
                  • <strong>Tags Inteligentes:</strong> Sistema de tags automáticas e manuais (#treino, #alimentação, #selfie, #marco)<br/>
                  • <strong>Categorização Automática:</strong> IA organiza conteúdo por tipo, data, localização, pessoas<br/>
                  • <strong>Álbuns Dinâmicos:</strong> Criação automática de álbuns por mês, evento, tipo de progresso<br/>
                  • <strong>Busca Avançada:</strong> Encontre conteúdo por data, tag, tipo, humor, localização, texto<br/>
                  • <strong>Filtros Múltiplos:</strong> Combine filtros para encontrar exatamente o que procura<br/>
                  • <strong>Favoritos e Destaques:</strong> Marque conteúdo especial para acesso rápido<br/>
                  • <strong>Arquivamento Inteligente:</strong> Sistema de arquivamento automático por idade<br/>
                  • <strong>Duplicatas:</strong> Detecção e remoção automática de conteúdo duplicado<br/>
                  • <strong>Metadados Ricos:</strong> Informações detalhadas sobre cada arquivo (localização, dispositivo, configurações)<br/>
                  • <strong>Coleções Temáticas:</strong> Agrupe conteúdo por temas específicos (Glow Up 2026, Verão 2025)<br/>
                  • <strong>Linha do Tempo:</strong> Visualização cronológica interativa de sua jornada<br/>
                  • <strong>Estatísticas de Conteúdo:</strong> Análise de padrões de upload e tipos de conteúdo mais frequentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <div className={'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
          <Card>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <Lock className={'h-5 w-5 text-red-500'} />
                <span>Privacidade & Segurança</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={'space-y-4'}>
                <div className={'bg-muted/50 p-4 rounded-lg'}>
                  <h4 className={'font-semibold mb-2'}>Controles de Privacidade</h4>
                  <p className={'text-sm text-muted-foreground'}>
                    • Configurações granulares de privacidade por arquivo<br/>
                    • Criptografia end-to-end para conteúdo sensível<br/>
                    • Controle total sobre compartilhamento<br/>
                    • Backup seguro com múltiplas camadas de proteção<br/>
                    • Autenticação biométrica para acesso<br/>
                    • Logs de acesso e atividade detalhados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={'flex items-center space-x-2'}>
                <BarChart3 className={'h-5 w-5 text-blue-500'} />
                <span>Analytics & Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={'space-y-4'}>
                <div className={'bg-muted/50 p-4 rounded-lg'}>
                  <h4 className={'font-semibold mb-2'}>Análises Inteligentes</h4>
                  <p className={'text-sm text-muted-foreground'}>
                    • Relatórios automáticos de progresso visual<br/>
                    • Análise de padrões de comportamento<br/>
                    • Insights sobre consistência de registros<br/>
                    • Correlação entre registros e outros dados<br/>
                    • Previsões de tendências pessoais<br/>
                    • Recomendações baseadas em análise visual
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RecordsPage;