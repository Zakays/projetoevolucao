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
import { FinancialEntry } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import FinanceChart from '@/components/FinanceChart';

const defaultForm = {
  type: 'expense',
  amount: 0,
  category: '',
  date: '',
  notes: '',
};

export default function Finance() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialEntry | null>(null);
  const [form, setForm] = useState<any>(defaultForm);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0,7);
  });

  const [settings, setSettings] = useState(storage.getSettings());
  const [simulatedData, setSimulatedData] = useState<number[] | null>(null);
  const [simulationApplied, setSimulationApplied] = useState(false);


  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    setEntries(storage.getFinancialEntries());
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...defaultForm, date: new Date().toISOString().slice(0,10) });
    setIsDialogOpen(true);
  };

  const openEdit = (e: FinancialEntry) => {
    setEditing(e);
    setForm({ type: e.type, amount: e.amount, category: e.category, date: e.date, notes: e.notes || '' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!form.category || !form.date || !form.amount || Number.isNaN(Number(form.amount))) {
      toast.error('Preencha data, categoria e valor válidos');
      return;
    }

    const payload = {
      type: form.type as 'income' | 'expense',
      amount: Math.abs(Number(form.amount)),
      category: form.category,
      date: form.date,
      notes: form.notes || undefined,
    };

    try {
      if (editing) {
        storage.updateFinancialEntry(editing.id, payload as any);
        toast.success('Lançamento atualizado');
      } else {
        storage.addFinancialEntry(payload as any);
        toast.success('Lançamento adicionado');
      }
      closeDialog();
      loadEntries();
    } catch (err) {
      toast.error('Erro ao salvar lançamento');
    }
  };

  const confirmDelete = (id: string) => {
    setToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const doDelete = () => {
    if (!toDeleteId) return;
    const ok = storage.deleteFinancialEntry(toDeleteId);
    if (ok) {
      toast.success('Lançamento removido');
      loadEntries();
    } else {
      toast.error('Erro ao remover lançamento');
    }
    setIsDeleteDialogOpen(false);
    setToDeleteId(null);
  };

  const [summary, setSummary] = useState({ income: 0, expenses: 0, profit: 0 });
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartBreakdown, setChartBreakdown] = useState<{ income: number; expenses: number; profit: number }[]>([]);

  const handleSimulateDay29 = () => {
    const [y, m] = selectedMonth.split('-').map(s => Number(s));
    const daysInMonth = new Date(y, m, 0).getDate();
    const arr = new Array<number>(daysInMonth).fill(0);

    for (let d = 1; d <= Math.min(28, daysInMonth); d++) {
      // random profit between -200 and 500
      const v = Math.round((Math.random() * 700 - 200) * 100) / 100;
      arr[d-1] = v;
    }

    if (daysInMonth >= 29) {
      arr[28] = Math.round((Math.random() * 700 - 200) * 100) / 100;
    }

    setSimulatedData(arr);
    setChartData(arr);
    // build breakdown from simulated net values (positive -> income, negative -> expense)
    const simulatedBreak = arr.map(v => ({ income: v >= 0 ? Math.round(v * 100) / 100 : 0, expenses: v < 0 ? Math.round(-v * 100) / 100 : 0, profit: Math.round(v * 100) / 100 }));
    setChartBreakdown(simulatedBreak);
    setSimulationApplied(true);

    // transient debug log
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('Finance: scheduled simulation', { month: selectedMonth, days: arr.length });
    }

    // visibility timeout handled in effect
  };


  useEffect(() => {
    const [y, m] = selectedMonth.split('-').map(s => Number(s));
    const s = storage.getMonthlyFinancialSummary(y, m);
    setSummary({ income: s.income, expenses: s.expenses, profit: s.profit });

    // compute chart data from storage unless we have a simulation
    if (!simulatedData) {
      const daily = storage.getDailyProfitForMonth(y, m);
      const breakdown = storage.getDailyBreakdownForMonth(y, m);
      setChartData(daily);
      setChartBreakdown(breakdown);
    }

    // refresh settings in case user toggled tests in settings page
    setSettings(storage.getSettings());

    // clear simulation when month changes
    setSimulatedData(null);
  }, [entries, selectedMonth]);

  // Listen for settings changes (so toggling on Settings page is reflected immediately)
  useEffect(() => {
    const onSettings = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof console !== 'undefined' && typeof console.debug === 'function') {
        console.debug('Finance: received settings change', detail);
      }
      if (detail) setSettings(detail);
      else setSettings(storage.getSettings());
      // clear any prior simulation flag when user toggles settings
      setSimulationApplied(false);
    };

    window.addEventListener('glowup:settings-changed', onSettings);
    return () => window.removeEventListener('glowup:settings-changed', onSettings);
  }, []);

  // When a simulation is applied, run side effects (toast + scroll) in an effect
  useEffect(() => {
    if (!simulationApplied) return;

    // run on next animation frame to avoid render-phase state updates
    const raf = requestAnimationFrame(() => {
      // Avoid calling `toast` here; we show a local banner for simulation instead to
      // prevent sonner/Toaster updating during render (reduces "setState in render" warnings).
      const el = document.querySelector('[data-testid="finance-chart"]');
      if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
        (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (typeof console !== 'undefined' && typeof console.debug === 'function') {
        console.debug('Finance: perform effect for simulation (no toast)', { selectedMonth, chartDataLength: chartData.length });
      }
    });

    const hide = setTimeout(() => setSimulationApplied(false), 6000);

    return () => {
      try { cancelAnimationFrame(raf); } catch (e) { /* noop */ }
      clearTimeout(hide);
    };
  }, [simulationApplied, selectedMonth, chartData.length]);

  return (
    <Layout>
      <div className={'space-y-6'}>
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'}>
          <div>
            <h1 className={'text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}>
              Controle Financeiro
            </h1>
            <p className={'text-muted-foreground mt-1'}>Registre ganhos e gastos e veja o lucro mensal.</p>

            {/* Debug panel to surface runtime state for troubleshooting (only when testsEnabled) */}
            {settings?.testsEnabled && (
              <div data-testid="simulation-debug" className={'mt-3 p-2 rounded bg-yellow-50 text-yellow-900 text-sm'}>
                <div><strong>testsEnabled:</strong> {String(settings?.testsEnabled)}</div>
                <div><strong>simulationApplied:</strong> {String(simulationApplied)}</div>
                <div><strong>simulatedData length:</strong> {simulatedData ? simulatedData.length : 0}</div>
                <div><strong>chartData length:</strong> {chartData.length}</div>
              </div>
            )}
          </div>

          <div className={'flex items-center space-x-2'}>
            <Input type={'month'} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />

            {settings?.testsEnabled && (
              <Button size={'sm'} variant={'outline'} onClick={handleSimulateDay29} data-testid="simulate-day29">
                Simular dia 29
              </Button>
            )}

            {/* Dev-only debug button: allows forcing simulation without opening Settings */}
            {settings?.testsEnabled && import.meta.env && (import.meta.env.MODE === 'development') && (
              <Button size={'sm'} variant={'ghost'} onClick={() => { handleSimulateDay29(); if (typeof console !== 'undefined' && typeof console.debug === 'function') { console.debug('Finance: debug simulate clicked'); } }} data-testid="simulate-day29-dev">
                Debug Simular
              </Button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className={'gradient-primary text-white border-0'} onClick={openNew}>
                  <Plus className={'h-4 w-4 mr-2'} />
                  Novo Lançamento
                </Button>
              </DialogTrigger>

              <DialogContent className={'max-w-2xl'}>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Editar Lançamento' : 'Adicionar Lançamento'}</DialogTitle>
                  <DialogDescription>Adicione receitas ou despesas e acompanhe seu fluxo mensal.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className={'space-y-4'}>
                  <div className={'grid grid-cols-2 gap-4'}>
                    <div className={'space-y-2'}>
                      <Label>Tipo</Label>
                      <Select value={form.type} onValueChange={(v: any) => setForm((p:any)=>({...p, type:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={'income'}>Receita</SelectItem>
                          <SelectItem value={'expense'}>Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={'space-y-2'}>
                      <Label>Valor</Label>
                      <Input type={'number'} step={'0.01'} value={form.amount as any} onChange={(e)=>setForm((p:any)=>({...p, amount: e.target.value}))} />
                    </div>
                  </div>

                  <div className={'grid grid-cols-2 gap-4'}>
                    <div className={'space-y-2'}>
                      <Label>Categoria</Label>
                      <Input value={form.category as any} onChange={(e)=>setForm((p:any)=>({...p, category: e.target.value}))} />
                    </div>

                    <div className={'space-y-2'}>
                      <Label>Data</Label>
                      <Input type={'date'} value={form.date as any} onChange={(e)=>setForm((p:any)=>({...p, date: e.target.value}))} />
                    </div>
                  </div>

                  <div className={'space-y-2'}>
                    <Label>Notas</Label>
                    <Textarea value={form.notes as any} onChange={(e)=>setForm((p:any)=>({...p, notes: e.target.value}))} />
                  </div>

                  <div className={'flex items-center justify-end space-x-2'}>
                    <Button type={'button'} variant={'outline'} onClick={closeDialog}>Cancelar</Button>
                    <Button type={'submit'} className={'gradient-primary text-white border-0'}>{editing ? 'Salvar' : 'Adicionar'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <div />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover lançamento</AlertDialogTitle>
                  <AlertDialogDescription>Tem certeza que deseja remover este lançamento?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={doDelete}>Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
          <Card className={'p-4'}>
            <CardHeader>
              <CardTitle>Resumo ({selectedMonth})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={'space-y-2'}>
                <div className={'flex items-center justify-between'}>
                  <div className={'text-sm text-muted-foreground'}>Receitas</div>
                  <div className={'text-lg font-semibold text-green-600'}>R$ {summary.income.toFixed(2)}</div>
                </div>

                <div className={'flex items-center justify-between'}>
                  <div className={'text-sm text-muted-foreground'}>Despesas</div>
                  <div className={'text-lg font-semibold text-red-600'}>R$ {summary.expenses.toFixed(2)}</div>
                </div>

                <hr />

                <div className={'flex items-center justify-between'}>
                  <div className={'text-sm text-muted-foreground'}>Lucro</div>
                  <div className={`text-lg font-semibold ${summary.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>R$ {summary.profit.toFixed(2)}</div>
                </div>

                {/* Chart moved to the bottom for larger view */}
                <div className={'mt-4 text-sm text-muted-foreground'}>A visualização do gráfico está localizada na parte inferior da página para melhor visualização.</div>
              </div>
            </CardContent>
          </Card>

          <div className={'md:col-span-2'}>
            <div className={'grid grid-cols-1 gap-4'}>
              {entries.length === 0 && (
                <Card className={'p-6'}>
                  <CardHeader>
                    <CardTitle>Nenhum lançamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    Adicione receitas e despesas usando "Novo Lançamento".
                  </CardContent>
                </Card>
              )}

              {entries.map(e => (
                <Card key={e.id} className={'p-4'}>
                  <div className={'flex items-start justify-between space-x-4'}>
                    <div className={'flex-1'}>
                      <h3 className={'text-lg font-semibold'}>{e.category} • {e.date}</h3>
                      <p className={'mt-2 text-sm text-muted-foreground'}>{e.notes}</p>
                    </div>

                    <div className={'flex flex-col space-y-2 items-end'}>
                      <div className={`text-lg font-semibold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>R$ {e.amount.toFixed(2)}</div>
                      <div className={'flex space-x-2'}>
                        <Button aria-label={`Editar lançamento ${e.id}`} size={'sm'} variant={'outline'} onClick={() => openEdit(e)}><Edit className={'h-4 w-4'} /></Button>
                        <Button aria-label={`Remover lançamento ${e.id}`} size={'sm'} variant={'destructive'} onClick={() => confirmDelete(e.id)}><Trash2 className={'h-4 w-4'} /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Large chart at the bottom */}
      <div className={'mt-6'}>
        <Card className={'p-6'}>
          <CardHeader>
            <CardTitle>Gráfico Diário ({selectedMonth})</CardTitle>
          </CardHeader>
          <CardContent>
            {simulationApplied && (
              <div data-testid="simulation-banner" className={'mb-4 p-3 rounded bg-green-50 text-green-800'}>
                Simulação aplicada — mostrando dados fictícios para visualização
              </div>
            )}

            {chartData && chartData.length > 0 ? (
              <FinanceChart data={chartData} monthLabel={selectedMonth} heightPx={360} breakdown={chartBreakdown} />
            ) : (
              <div className={'text-sm text-muted-foreground'}>Sem dados para este mês</div>
            )}
          </CardContent>
        </Card>
      </div>

    </Layout>
  );
}
