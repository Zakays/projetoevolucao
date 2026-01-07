import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { storage } from '@/lib/storage';
import { BodyMeasurement } from '@/types';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Scale, 
  User, 
  Camera,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Zap,
  Smile
} from 'lucide-react';

interface BodyFormData {
  weight: number;
  measurements: {
    chest: number;
    waist: number;
    hips: number;
    arms: number;
    thighs: number;
  };
  selfAssessment: {
    energy: number;
    confidence: number;
    selfEsteem: number;
  };
  notes: string;
}

const defaultFormData: BodyFormData = {
  weight: 0,
  measurements: {
    chest: 0,
    waist: 0,
    hips: 0,
    arms: 0,
    thighs: 0,
  },
  selfAssessment: {
    energy: 5,
    confidence: 5,
    selfEsteem: 5,
  },
  notes: '',
};

const Body = () => {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);
  const [formData, setFormData] = useState<BodyFormData>(defaultFormData);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadMeasurements();
    setSelectedDate(today);
  }, []);

  const loadMeasurements = () => {
    const loaded = storage.getBodyMeasurements();
    setMeasurements(loaded || []);
  };

  const saveMeasurement = (measurement: Omit<BodyMeasurement, 'id'>) => {
    storage.addBodyMeasurement(measurement);
    loadMeasurements();
  };

  const updateMeasurement = (id: string, measurement: Partial<BodyMeasurement>) => {
    const updated = storage.updateBodyMeasurement(id, measurement);
    if (updated) loadMeasurements();
  };

  const deleteMeasurement = (id: string) => {
    const deleted = storage.deleteBodyMeasurement(id);
    if (deleted) loadMeasurements();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Basic validation for weight / measurements
      if (formData.weight && (formData.weight < 0 || formData.weight > 500)) {
        toast.error('Peso inválido');
        return;
      }

      const measurementData = {
        date: selectedDate,
        weight: formData.weight || undefined,
        measurements: Object.values(formData.measurements).some(v => v > 0) ? formData.measurements : undefined,
        selfAssessment: formData.selfAssessment,
        notes: formData.notes || undefined,
      };

      if (editingMeasurement) {
        updateMeasurement(editingMeasurement.id, measurementData);
        toast.success('Medicao atualizada com sucesso!');
      } else {
        saveMeasurement(measurementData);
        toast.success('Medicao registrada com sucesso!');
      }
      
      closeDialog();
    } catch (error) {
      toast.error('Erro ao salvar medicao');
    }
  };

  const handleEdit = (measurement: BodyMeasurement) => {
    setEditingMeasurement(measurement);
    setFormData({
      weight: measurement.weight || 0,
      measurements: {
        chest: measurement.measurements?.chest ?? 0,
        waist: measurement.measurements?.waist ?? 0,
        hips: measurement.measurements?.hips ?? 0,
        arms: measurement.measurements?.arms ?? 0,
        thighs: measurement.measurements?.thighs ?? 0,
      },
      selfAssessment: measurement.selfAssessment,
      notes: measurement.notes || '',
    });
    setSelectedDate(measurement.date);
    setIsDialogOpen(true);
  };

  const handleDelete = (measurementId: string) => {
    deleteMeasurement(measurementId);
    toast.success('Medicao excluida com sucesso!');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMeasurement(null);
    setFormData(defaultFormData);
    setSelectedDate(today);
  };

  const getWeightTrend = (currentWeight: number, previousWeight: number) => {
    if (currentWeight > previousWeight) return { icon: TrendingUp, color: 'text-red-500', text: 'Aumento' };
    if (currentWeight < previousWeight) return { icon: TrendingDown, color: 'text-green-500', text: 'Reducao' };
    return { icon: Minus, color: 'text-gray-500', text: 'Estavel' };
  };

  const getAssessmentColor = (value: number) => {
    if (value >= 8) return 'text-green-500';
    if (value >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAssessmentLabel = (value: number) => {
    if (value >= 8) return 'Excelente';
    if (value >= 6) return 'Bom';
    if (value >= 4) return 'Regular';
    return 'Baixo';
  };

  const sortedMeasurements = [...measurements].sort((a, b) => b.date.localeCompare(a.date));
  const latestMeasurement = sortedMeasurements[0];
  const previousMeasurement = sortedMeasurements[1];

  return (
    <Layout>
      <div className={'space-y-6'}>
        {/* Header */}
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Corpo & Aparencia
            </h1>
            <p className={'text-muted-foreground mt-1'}>
              Monitore sua evolucao fisica e autoestima
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={'gradient-primary text-white border-0'}>
                <Plus className={'h-4 w-4 mr-2'} />
                Nova Medicao
              </Button>
            </DialogTrigger>
            <DialogContent className={'max-w-2xl max-h-[90vh] overflow-y-auto'}>
              <DialogHeader>
                <DialogTitle>
                  {editingMeasurement ? 'Editar Medicao' : 'Nova Medicao'}
                </DialogTitle>
                <DialogDescription>
                  Registre suas medidas corporais, autoavaliação e notas para acompanhar sua evolução.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className={'space-y-6'}>
                {/* Data */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'date'}>Data</Label>
                  <Input
                    id={'date'}
                    type={'date'}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                {/* Peso */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'weight'}>Peso (kg)</Label>
                  <Input
                    id={'weight'}
                    type={'number'}
                    step={'0.1'}
                    value={formData.weight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    placeholder={'Ex: 70.5'}
                  />
                </div>

                {/* Medidas Corporais */}
                <div className={'space-y-4'}>
                  <Label>Medidas Corporais (cm)</Label>
                  <div className={'grid grid-cols-2 gap-4'}>
                    <div className={'space-y-2'}>
                      <Label htmlFor={'chest'} className={'text-sm'}>Peito</Label>
                      <Input
                        id={'chest'}
                        type={'number'}
                        step={'0.1'}
                        value={formData.measurements.chest || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, chest: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder={'Ex: 95.0'}
                      />
                    </div>
                    
                    <div className={'space-y-2'}>
                      <Label htmlFor={'waist'} className={'text-sm'}>Cintura</Label>
                      <Input
                        id={'waist'}
                        type={'number'}
                        step={'0.1'}
                        value={formData.measurements.waist || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, waist: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder={'Ex: 80.0'}
                      />
                    </div>
                    
                    <div className={'space-y-2'}>
                      <Label htmlFor={'hips'} className={'text-sm'}>Quadril</Label>
                      <Input
                        id={'hips'}
                        type={'number'}
                        step={'0.1'}
                        value={formData.measurements.hips || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, hips: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder={'Ex: 90.0'}
                      />
                    </div>
                    
                    <div className={'space-y-2'}>
                      <Label htmlFor={'arms'} className={'text-sm'}>Bracos</Label>
                      <Input
                        id={'arms'}
                        type={'number'}
                        step={'0.1'}
                        value={formData.measurements.arms || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, arms: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder={'Ex: 35.0'}
                      />
                    </div>
                    
                    <div className={'space-y-2 col-span-2'}>
                      <Label htmlFor={'thighs'} className={'text-sm'}>Coxas</Label>
                      <Input
                        id={'thighs'}
                        type={'number'}
                        step={'0.1'}
                        value={formData.measurements.thighs || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, thighs: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder={'Ex: 55.0'}
                      />
                    </div>
                  </div>
                </div>

                {/* Autoavaliacao */}
                <div className={'space-y-4'}>
                  <Label>Autoavaliacao (1-10)</Label>
                  
                  <div className={'space-y-4'}>
                    <div className={'space-y-2'}>
                      <div className={'flex items-center justify-between'}>
                        <Label className={'text-sm flex items-center space-x-2'}>
                          <Zap className={'h-4 w-4'} />
                          <span>Energia</span>
                        </Label>
                        <span className={'text-sm font-medium'}>{formData.selfAssessment.energy}</span>
                      </div>
                      <Slider
                        value={[formData.selfAssessment.energy]}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          selfAssessment: { ...prev.selfAssessment, energy: value[0] }
                        }))}
                        max={10}
                        min={1}
                        step={1}
                        className={'w-full'}
                      />
                    </div>
                    
                    <div className={'space-y-2'}>
                      <div className={'flex items-center justify-between'}>
                        <Label className={'text-sm flex items-center space-x-2'}>
                          <Heart className={'h-4 w-4'} />
                          <span>Confianca</span>
                        </Label>
                        <span className={'text-sm font-medium'}>{formData.selfAssessment.confidence}</span>
                      </div>
                      <Slider
                        value={[formData.selfAssessment.confidence]}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          selfAssessment: { ...prev.selfAssessment, confidence: value[0] }
                        }))}
                        max={10}
                        min={1}
                        step={1}
                        className={'w-full'}
                      />
                    </div>
                    
                    <div className={'space-y-2'}>
                      <div className={'flex items-center justify-between'}>
                        <Label className={'text-sm flex items-center space-x-2'}>
                          <Smile className={'h-4 w-4'} />
                          <span>Autoestima</span>
                        </Label>
                        <span className={'text-sm font-medium'}>{formData.selfAssessment.selfEsteem}</span>
                      </div>
                      <Slider
                        value={[formData.selfAssessment.selfEsteem]}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          selfAssessment: { ...prev.selfAssessment, selfEsteem: value[0] }
                        }))}
                        max={10}
                        min={1}
                        step={1}
                        className={'w-full'}
                      />
                    </div>
                  </div>
                </div>

                {/* Observacoes */}
                <div className={'space-y-2'}>
                  <Label htmlFor={'notes'}>Observacoes</Label>
                  <Textarea
                    id={'notes'}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={'Como se sente, mudancas percebidas, objetivos, etc...'}
                    rows={3}
                  />
                </div>

                {/* Botoes */}
                <div className={'flex justify-end space-x-2 pt-4'}>
                  <Button type={'button'} variant={'outline'} onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type={'submit'} className={'gradient-primary text-white border-0'}>
                    {editingMeasurement ? 'Atualizar' : 'Registrar'} Medicao
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Latest Stats */}
        {latestMeasurement && (
          <div className={'grid grid-cols-1 md:grid-cols-4 gap-4'}>
            {latestMeasurement.weight && (
              <Card>
                <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                  <CardTitle className={'text-sm font-medium'}>Peso Atual</CardTitle>
                  <Scale className={'h-4 w-4 text-muted-foreground'} />
                </CardHeader>
                <CardContent>
                  <div className={'text-2xl font-bold'}>{latestMeasurement.weight} kg</div>
                  {previousMeasurement?.weight && (
                    <div className={'flex items-center space-x-1 text-xs text-muted-foreground'}>
                      {(() => {
                        const trend = getWeightTrend(latestMeasurement.weight, previousMeasurement.weight);
                        const TrendIcon = trend.icon;
                        return (
                          <>
                            <TrendIcon className={`h-3 w-3 ${trend.color}`} />
                            <span>{Math.abs(latestMeasurement.weight - previousMeasurement.weight).toFixed(1)} kg</span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                <CardTitle className={'text-sm font-medium'}>Energia</CardTitle>
                <Zap className={'h-4 w-4 text-muted-foreground'} />
              </CardHeader>
              <CardContent>
                <div className={'text-2xl font-bold'}>{latestMeasurement.selfAssessment.energy}/10</div>
                <p className={`text-xs ${getAssessmentColor(latestMeasurement.selfAssessment.energy)}`}>
                  {getAssessmentLabel(latestMeasurement.selfAssessment.energy)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                <CardTitle className={'text-sm font-medium'}>Confianca</CardTitle>
                <Heart className={'h-4 w-4 text-muted-foreground'} />
              </CardHeader>
              <CardContent>
                <div className={'text-2xl font-bold'}>{latestMeasurement.selfAssessment.confidence}/10</div>
                <p className={`text-xs ${getAssessmentColor(latestMeasurement.selfAssessment.confidence)}`}>
                  {getAssessmentLabel(latestMeasurement.selfAssessment.confidence)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={'flex flex-row items-center justify-between space-y-0 pb-2'}>
                <CardTitle className={'text-sm font-medium'}>Autoestima</CardTitle>
                <Smile className={'h-4 w-4 text-muted-foreground'} />
              </CardHeader>
              <CardContent>
                <div className={'text-2xl font-bold'}>{latestMeasurement.selfAssessment.selfEsteem}/10</div>
                <p className={`text-xs ${getAssessmentColor(latestMeasurement.selfAssessment.selfEsteem)}`}>
                  {getAssessmentLabel(latestMeasurement.selfAssessment.selfEsteem)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Measurements History */}
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center space-x-2'}>
              <User className={'h-5 w-5'} />
              <span>Historico de Medicoes</span>
              <Badge variant={'outline'}>{measurements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedMeasurements.length === 0 ? (
              <div className={'text-center py-8 text-muted-foreground'}>
                <User className={'h-12 w-12 mx-auto mb-4 opacity-50'} />
                <p>Nenhuma medicao registrada ainda.</p>
                <p className={'text-sm'}>Comece registrando suas primeiras medidas!</p>
              </div>
            ) : (
              <div className={'space-y-4'}>
                {sortedMeasurements.map((measurement) => (
                  <Card key={measurement.id} data-testid={`measurement-card-${measurement.id}`} className={'hover:shadow-md transition-shadow'}>
                    <CardContent className={'p-4'}>
                      <div className={'flex items-start justify-between'}>
                        <div className={'flex-1'}>
                          <div className={'flex items-center space-x-3 mb-3'}>
                            <h3 className={'font-semibold'}>
                              {new Date(measurement.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </h3>
                          </div>
                          
                          <div className={'grid grid-cols-1 md:grid-cols-2 gap-4 mb-3'}>
                            {/* Peso e Medidas */}
                            <div>
                              {measurement.weight && (
                                <div className={'mb-2'}>
                                  <span className={'text-sm font-medium'}>Peso: </span>
                                  <span className={'text-sm'}>{measurement.weight} kg</span>
                                </div>
                              )}
                              
                              {measurement.measurements && Object.values(measurement.measurements).some(v => v > 0) && (
                                <div className={'space-y-1'}>
                                  <p className={'text-sm font-medium'}>Medidas (cm):</p>
                                  <div className={'text-xs text-muted-foreground space-y-1'}>
                                    {measurement.measurements.chest > 0 && <div>Peito: {measurement.measurements.chest}</div>}
                                    {measurement.measurements.waist > 0 && <div>Cintura: {measurement.measurements.waist}</div>}
                                    {measurement.measurements.hips > 0 && <div>Quadril: {measurement.measurements.hips}</div>}
                                    {measurement.measurements.arms > 0 && <div>Bracos: {measurement.measurements.arms}</div>}
                                    {measurement.measurements.thighs > 0 && <div>Coxas: {measurement.measurements.thighs}</div>}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Autoavaliacao */}
                            <div>
                              <p className={'text-sm font-medium mb-2'}>Autoavaliacao:</p>
                              <div className={'space-y-1 text-xs'}>
                                <div className={'flex items-center justify-between'}>
                                  <span>Energia:</span>
                                  <span className={getAssessmentColor(measurement.selfAssessment.energy)}>
                                    {measurement.selfAssessment.energy}/10
                                  </span>
                                </div>
                                <div className={'flex items-center justify-between'}>
                                  <span>Confianca:</span>
                                  <span className={getAssessmentColor(measurement.selfAssessment.confidence)}>
                                    {measurement.selfAssessment.confidence}/10
                                  </span>
                                </div>
                                <div className={'flex items-center justify-between'}>
                                  <span>Autoestima:</span>
                                  <span className={getAssessmentColor(measurement.selfAssessment.selfEsteem)}>
                                    {measurement.selfAssessment.selfEsteem}/10
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {measurement.notes && (
                            <p className={'text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg'}>
                              {measurement.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className={'flex items-center space-x-2 ml-4'}>
                          <Button
                            variant={'outline'}
                            size={'icon'}
                            onClick={() => handleEdit(measurement)}
                          >
                            <Edit className={'h-4 w-4'} />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button aria-label={`Excluir medicao ${measurement.date} ${measurement.id}`} data-testid={`delete-button-${measurement.id}`} variant={'outline'} size={'icon'} className={'text-destructive hover:text-destructive'}>
                                <Trash2 className={'h-4 w-4'} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Medicao</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta medicao? 
                                  Esta acao nao pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(measurement.id)}
                                  aria-label={`Confirmar exclusao medicao ${measurement.id}`}
                                  data-testid={`confirm-delete-${measurement.id}`}
                                  className={'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                                >
                                  Excluir
                                </AlertDialogAction> 
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Body;