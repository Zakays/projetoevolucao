import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { Course } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react';

const defaultCourseForm: Omit<Course, 'id'> = {
  title: '',
  provider: '',
  category: '',
  status: 'planned',
  progress: 0,
  duration: 0,
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<Omit<Course, 'id'>>(defaultCourseForm);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    setCourses(storage.getCourses());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Titulo obrigatorio');
      return;
    }

    if (formData.progress < 0 || formData.progress > 100) {
      toast.error('Progresso deve estar entre 0 e 100');
      return;
    }

    if (formData.duration < 0) {
      toast.error('Duracao invalida');
      return;
    }

    try {
      if (editingCourse) {
        storage.updateCourse(editingCourse.id, formData);
        toast.success('Curso atualizado');
      } else {
        storage.addCourse(formData);
        toast.success('Curso adicionado');
      }
      closeDialog();
      loadCourses();
    } catch (err) {
      toast.error('Erro ao salvar curso');
    }
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      provider: course.provider,
      category: course.category,
      status: course.status,
      progress: course.progress,
      duration: course.duration,
      startDate: course.startDate,
      endDate: course.endDate,
      certificateUrl: course.certificateUrl,
      notes: course.notes,
    });
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingCourse(null);
    setFormData(defaultCourseForm);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
    setFormData(defaultCourseForm);
  };

  const confirmDelete = (id: string) => {
    setToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const doDelete = () => {
    if (!toDeleteId) return;
    const ok = storage.deleteCourse(toDeleteId);
    if (ok) {
      toast.success('Curso removido');
      loadCourses();
    } else {
      toast.error('Erro ao remover curso');
    }
    setIsDeleteDialogOpen(false);
    setToDeleteId(null);
  };

  return (
    <Layout>
      <div className={'space-y-6'}>
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Histórico de Cursos
            </h1>
            <p className={'text-muted-foreground mt-1'}>Registre cursos, acompanhe progresso e adicione links para certificados.</p>
          </div>

          <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className={'gradient-primary text-white border-0'} onClick={openNew}>
                  <Plus className={'h-4 w-4 mr-2'} />
                  Novo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className={'max-w-2xl'}>
                <DialogHeader>
                  <DialogTitle>{editingCourse ? 'Editar Curso' : 'Adicionar Curso'}</DialogTitle>
                  <DialogDescription>
                    Use este formulário para adicionar ou editar informações do curso.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className={'space-y-4'}>
                  <div className={'grid grid-cols-2 gap-4'}>
                    <div className={'space-y-2'}>
                      <Label htmlFor={'title'}>Titulo</Label>
                      <Input id={'title'} value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
                    </div>

                    <div className={'space-y-2'}>
                      <Label htmlFor={'provider'}>Fornecedor</Label>
                      <Input id={'provider'} value={formData.provider} onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))} />
                    </div>
                  </div>

                  <div className={'grid grid-cols-3 gap-4'}>
                    <div className={'space-y-2'}>
                      <Label htmlFor={'status'}>Status</Label>
                      <Select value={formData.status} onValueChange={(v: any) => setFormData(prev => ({ ...prev, status: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={'planned'}>Planejado</SelectItem>
                          <SelectItem value={'in_progress'}>Em progresso</SelectItem>
                          <SelectItem value={'completed'}>Concluido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={'space-y-2'}>
                      <Label htmlFor={'progress'}>Progresso (%)</Label>
                      <Input id={'progress'} type={'number'} value={formData.progress as any} onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))} />
                    </div>

                    <div className={'space-y-2'}>
                      <Label htmlFor={'duration'}>Duracao (horas)</Label>
                      <Input id={'duration'} type={'number'} step={'0.5'} value={formData.duration as any} onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>

                  <div className={'grid grid-cols-2 gap-4'}>
                    <div className={'space-y-2'}>
                      <Label htmlFor={'startDate'}>Inicio</Label>
                      <Input id={'startDate'} type={'date'} value={formData.startDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                    </div>
                    <div className={'space-y-2'}>
                      <Label htmlFor={'endDate'}>Fim</Label>
                      <Input id={'endDate'} type={'date'} value={formData.endDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                    </div>
                  </div>

                  <div className={'space-y-2'}>
                    <Label htmlFor={'certificateUrl'}>Link do Certificado</Label>
                    <Input id={'certificateUrl'} value={formData.certificateUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, certificateUrl: e.target.value }))} />
                  </div>

                  <div className={'space-y-2'}>
                    <Label htmlFor={'notes'}>Notas</Label>
                    <Textarea id={'notes'} value={formData.notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
                  </div>

                  <div className={'flex items-center justify-end space-x-2'}>
                    <Button type={'button'} variant={'outline'} onClick={closeDialog}>Cancelar</Button>
                    <Button type={'submit'} className={'gradient-primary text-white border-0'}>{editingCourse ? 'Salvar' : 'Adicionar'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                {/* Trigger handled via confirmDelete above */}
                <div />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover Curso</AlertDialogTitle>
                  <AlertDialogDescription>Tem certeza que deseja remover este curso? Esta ação não pode ser revertida.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={doDelete}>Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {courses.length === 0 && (
            <Card className={'p-6'}>
              <CardHeader>
                <CardTitle>Nenhum curso registrado</CardTitle>
              </CardHeader>
              <CardContent>
                Adicione seu primeiro curso clicando em "Novo Curso".
              </CardContent>
            </Card>
          )}

          {courses.map((course) => (
            <Card key={course.id} className={'p-4'}>
              <div className={'flex items-start justify-between space-x-4'}>
                <div className={'flex-1'}>
                  <h3 className={'text-lg font-semibold'}>{course.title}</h3>
                  <p className={'text-sm text-muted-foreground'}>{course.provider} • {course.category}</p>
                  <p className={'mt-2 text-sm text-muted-foreground'}>Progresso: {course.progress}% • Duração: {course.duration}h</p>
                  {course.certificateUrl && (
                    <p className={'mt-2'}>
                      <a className={'flex items-center text-sm text-primary hover:underline'} href={course.certificateUrl} target={'_blank'} rel={'noreferrer'}>
                        <LinkIcon className={'h-4 w-4 mr-2'} /> Ver certificado
                      </a>
                    </p>
                  )}
                </div>

                <div className={'flex flex-col space-y-2'}>
                  <div className={'flex space-x-2'}>
                    <Button aria-label={`Editar curso ${course.id}`} size={'sm'} variant={'outline'} onClick={() => openEdit(course)}>
                      <Edit className={'h-4 w-4'} />
                    </Button>
                    <Button aria-label={`Remover curso ${course.id}`} size={'sm'} variant={'destructive'} onClick={() => confirmDelete(course.id)}>
                      <Trash2 className={'h-4 w-4'} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
