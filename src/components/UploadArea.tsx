import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Upload, X, Image, FileText, Video, Mic } from 'lucide-react';
import type { UploadedFile } from '@/types';

// No size limit (user requested unlimited). Accept only png, jpeg and mp4.
const MAX_FILE_SIZE = Infinity;
const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'video/mp4',
];

export const UploadArea: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; url: string; description?: string; category?: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File) => {
    if (MAX_FILE_SIZE !== Infinity && file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} é muito grande. Limite ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
      return false;
    }

    const name = file.name.toLowerCase();
    const extOk = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.mp4');
    const mimeOk = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'video/mp4';
    const ok = mimeOk || extOk;
    if (!ok) {
      toast.error(`${file.name} não é um tipo de arquivo suportado (aceito: png, jpeg, mp4)`);
      return false;
    }

    return true;
  };

  const handleFiles = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;

    const arr = Array.from(selected);
    const valid = arr.filter(validateFile);
    if (valid.length === 0) return;

    setFiles(prev => [...prev, ...valid]);

    valid.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = String(e.target?.result || '');
        setPreviews(prev => [...prev, { file, url, description: '', category: 'uploads' }]);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePreview = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (files.length === 0) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    try {
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];

        const uploaded: Omit<UploadedFile, 'id' | 'uploadDate' | 'previewUrl'> & { previewUrl?: string } = {
          filename: p.file.name,
          originalName: p.file.name,
          size: p.file.size,
          type: p.file.type,
          tags: [],
          category: p.category || 'uploads',
          description: p.description || '',
          metadata: {},
        };

        // Pass the actual file blob to storage so it can be saved in IndexedDB
        storage.addUploadedFile(uploaded, p.file);
      }

      setFiles([]);
      setPreviews([]);
      if (inputRef.current) inputRef.current.value = '';
      toast.success('Arquivos enviados com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar arquivos');
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 rounded-lg border-dashed border-2 ${dragOver ? 'border-primary/80 bg-primary/5' : 'border-muted/30'} flex flex-col items-center justify-center text-center space-y-4`}
      >
        <Upload className={'h-8 w-8 text-muted-foreground'} />
        <p className={'text-sm text-muted-foreground'}>Arraste e solte arquivos aqui ou</p>
        <div className={'flex items-center space-x-2'}>
          <Input type="file" multiple ref={inputRef} onChange={(e) => handleFiles(e.target.files)} className={'hidden'} id={'upload-input'} />
          <label htmlFor={'upload-input'}>
            <Button variant={'outline'} onClick={() => inputRef.current?.click()}>
              Selecionar Arquivos
            </Button>
          </label>
          <Button variant={'ghost'} onClick={() => { setFiles([]); setPreviews([]); if (inputRef.current) inputRef.current.value = ''; }}>
            Limpar
          </Button>
        </div>
        <p className={'text-xs text-muted-foreground'}>Tipos suportados: PNG, JPEG, MP4 — Sem limite de tamanho</p>
      </div>

      {previews.length > 0 && (
        <div className={'grid grid-cols-2 md:grid-cols-4 gap-3 mt-4'}>
          {previews.map((p, idx) => (
            <div key={idx} className={'border rounded-lg p-2 relative'}>
              <button aria-label={`Remover arquivo ${p.file.name}`} title={`Remover ${p.file.name}`} className={'absolute top-2 right-2 p-1 bg-background border border-muted/20 rounded-full'} onClick={() => removePreview(idx)}>
                <X className={'h-3 w-3'} />
              </button>

              <div className={'h-32 flex items-center justify-center overflow-hidden'}>
                {p.file.type.startsWith('image/') ? (
                  <img src={p.url} alt={p.file.name} className={'object-contain max-h-32 w-auto max-w-full'} />
                ) : p.file.type.startsWith('video/') ? (
                  <video src={p.url} controls className={'object-contain max-h-32 w-auto max-w-full'} />
                ) : (
                  <div className={'flex items-center space-x-2'}>
                    <FileText />
                    <div>{p.file.name}</div>
                  </div>
                )}
              </div>

              <div className={'mt-2 text-xs text-muted-foreground'}>
                <div className={'font-medium'}>{p.file.name}</div>
                <div>{Math.round(p.file.size / 1024)} KB • {p.file.type || 'unknown'}</div>
              </div>

              <div className={'mt-2'}>
                <label className="text-xs text-muted-foreground">Categoria</label>
                <select value={p.category} onChange={(e) => {
                  const val = e.target.value;
                  setPreviews(prev => prev.map((pp, i) => i === idx ? { ...pp, category: val } : pp));
                }} className="w-full p-1 border rounded mt-1 bg-background text-foreground">
                  <option value="uploads">Uploads</option>
                  <option value="selfie">Selfie de Progresso</option>
                  <option value="video-treino">Vídeo de Treino</option>
                  <option value="before-after">Before & After</option>
                  <option value="marco-especial">Marco Especial</option>
                  <option value="progresso-mensal">Progresso Mensal</option>
                </select>

                <label className="text-xs text-muted-foreground mt-2 block">Descrição</label>
                <textarea value={p.description} onChange={(e) => {
                  const val = e.target.value;
                  setPreviews(prev => prev.map((pp, i) => i === idx ? { ...pp, description: val } : pp));
                }} className="w-full p-1 border rounded mt-1 text-xs bg-background text-foreground" rows={3} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={'flex justify-end mt-4'}>
        <Button onClick={uploadAll} className={'gradient-primary text-white border-0'}>
          Enviar ({files.length})
        </Button>
      </div>
    </div>
  );
};

export default UploadArea;
