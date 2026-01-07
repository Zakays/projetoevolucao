import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { storage } from '@/lib/storage';
import { UploadedFile } from '@/types';
import { Image, Filter, Search, Eye, Trash2, Plus } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const Gallery: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPair, setSelectedPair] = useState<{ before?: UploadedFile; after?: UploadedFile } | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<UploadedFile | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    const loaded = storage.getUploadedFiles();
    setFiles(loaded);
  };

  const filtered = files.filter(f => {
    const matchesFilter = filter === 'all' || f.category === filter;
    const matchesSearch = search === '' || f.originalName.toLowerCase().includes(search.toLowerCase()) || (f.tags || []).join(' ').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const removeFile = (id: string) => {
    if (!confirm('Excluir arquivo?')) return;
    const deleted = storage.deleteUploadedFile(id);
    if (deleted) {
      toast.success('Arquivo excluído');
      loadFiles();
    } else {
      toast.error('Não foi possível excluir o arquivo');
    }
  };

  const openCompare = () => {
    if (!selectedPair || !selectedPair.before || !selectedPair.after) {
      toast.error('Selecione duas imagens para comparar');
      return;
    }
    setCompareOpen(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5 text-purple-500" />
          <span>Galeria</span>
          <span className="text-sm text-muted-foreground">{files.length} arquivos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded-md bg-background" data-testid="gallery-filter-select">
            <option value="all">Todos</option>
            <option value="uploads">Uploads</option>
            <option value="treino">Treino</option>
            <option value="alimentacao">Alimentação</option>
            <option value="selfie">Selfie</option>
          </select>
          <Button variant="outline" onClick={loadFiles}><Filter className="h-4 w-4 mr-2"/>Filtrar</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map(file => (
            <div key={file.id} className="border rounded-lg p-2 relative">
              <div className="h-36 flex items-center justify-center overflow-hidden bg-muted/50 rounded">
                {file.type.startsWith('image/') ? (
                  <img src={file.previewUrl || ''} alt={file.originalName} className="object-cover h-full w-full" />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Image className="h-6 w-6" />
                    <div className="text-xs">{file.originalName}</div>
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs">
                <div className="font-medium truncate">{file.originalName}</div>
                <div className="text-muted-foreground">{Math.round(file.size / 1024)} KB</div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-1">
                  <Button size="icon" variant="outline" onClick={() => setSelectedPreview(file)} title="Visualizar"><Eye className="h-4 w-4"/></Button>
                  {file.type.startsWith('image/') && (
                    <Checkbox
                      checked={(selectedPair?.before?.id === file.id) || (selectedPair?.after?.id === file.id) || false}
                      onCheckedChange={(checked) => {
                        setSelectedPair(prev => {
                          const next = { ...(prev || {}) } as any;
                          const isSelected = next.before?.id === file.id || next.after?.id === file.id;
                          if (isSelected) {
                            if (next.before?.id === file.id) next.before = undefined;
                            if (next.after?.id === file.id) next.after = undefined;
                            // if both undefined
                            if (!next.before && !next.after) return null;
                            return next;
                          }

                          if (!next.before) next.before = file;
                          else if (!next.after) next.after = file;
                          else next.after = file;

                          return next;
                        });
                      }}
                      className="mt-1"
                      data-testid={`gallery-select-${file.id}`}
                      aria-label={`select-for-compare-${file.id}`}
                    />
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => removeFile(file.id)} title="Excluir"><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 justify-end">
          <Button onClick={() => {
            const images = files.filter(f => f.type.startsWith('image/'));
            if (images.length < 2) { toast.error('Precisa de pelo menos 2 imagens para comparar'); return; }
            setSelectedPair({ before: images[0], after: images[1] });
            setCompareOpen(true);
          }}><Plus className="h-4 w-4 mr-2"/>Comparar 2 primeiras</Button>

          <Button variant="outline" onClick={openCompare} data-testid="gallery-compare-selected">Comparar Selecionadas</Button>
        </div>

        {/* Preview Dialog */}
        <Dialog open={compareOpen || !!selectedPreview} onOpenChange={(open) => { if (!open) { setSelectedPreview(null); setSelectedPair(null); setCompareOpen(false); } }}>
          <DialogTrigger asChild>
            {/* Invisible trigger - handled programmatically */}
            <div />
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPreview ? selectedPreview.originalName : 'Comparação'}</DialogTitle>
              <DialogDescription>Visualize ou compare imagens selecionadas.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedPreview && (
                <div>
                  {selectedPreview.type.startsWith('image/') ? (
                    <img src={selectedPreview.previewUrl} alt={selectedPreview.originalName} className="w-full object-contain" />
                  ) : (
                    <div className="text-center">Preview não disponível para esse tipo de arquivo</div>
                  )}
                </div>
              )}

              {selectedPair && selectedPair.before && selectedPair.after && (
                <BeforeAfterSlider before={selectedPair.before.previewUrl || ''} after={selectedPair.after.previewUrl || ''} height={400} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default Gallery;
