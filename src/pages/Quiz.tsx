import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { QuizQuestion } from '@/types';
import { shuffleArray, shuffleQuestionOptions } from '@/lib/quizUtils';

const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const qs = storage.getQuizQuestions();
    setQuestions(qs);
  }, []);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('any');

  const start = () => {
    setScore(0);
    setCurrentIndex(0);

    // Load fresh questions and apply filters
    const qs = storage.getQuizQuestions();
    const filtered = qs.filter(q => {
      if (filterCategory !== 'all' && q.category !== filterCategory) return false;
      if (filterDifficulty !== 'any' && q.difficulty !== filterDifficulty) return false;
      return true;
    });

    if (filtered.length === 0) {
      // No questions for selected filters
      // Keep started false and do nothing
      return;
    }

    // Shuffle questions and shuffle options inside each question (preserving correctAnswer index)
    const shuffledQuestions = shuffleArray(filtered).map(q => shuffleQuestionOptions(q));

    setQuestions(shuffledQuestions);
    setStarted(true);
  };

  const seedQuestions = () => {
    storage.addQuizQuestion({
      question: 'Qual a capital do Brasil?',
      options: ['São Paulo', 'Brasília', 'Rio de Janeiro', 'Salvador'],
      correctAnswer: 1,
      category: 'geografia',
      difficulty: 'easy',
      tags: [],
    });

    storage.addQuizQuestion({
      question: 'Quanto é 5 + 7?',
      options: ['10', '11', '12', '13'],
      correctAnswer: 2,
      category: 'matematica',
      difficulty: 'easy',
      tags: [],
    });

    const qs = storage.getQuizQuestions();
    setQuestions(qs);
  };

  const answer = (optionIndex: number) => {
    const q = questions[currentIndex];
    if (!q) return;

    const got = q.correctAnswer === optionIndex;
    const newScore = score + (got ? 1 : 0);
    setScore(newScore);

    // Sequential advancement to avoid infinite looping
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      // finished
      storage.addQuizResult({ score: newScore, totalQuestions: questions.length, correctAnswers: newScore, timeSpent: 0, category: 'general', difficulty: 'medium', questions: questions, userAnswers: [] });
      setStarted(false);
    }
  };

  const [adminQuestion, setAdminQuestion] = useState('');
  const [adminOptions, setAdminOptions] = useState('');
  const [adminCorrect, setAdminCorrect] = useState(0);
  const [adminCategory, setAdminCategory] = useState('general');
  const [adminDifficulty, setAdminDifficulty] = useState<'easy'|'medium'|'hard'>('easy');

  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingOptions, setEditingOptions] = useState('');
  const [editingCorrect, setEditingCorrect] = useState(0);
  const [editingDifficulty, setEditingDifficulty] = useState<'easy'|'medium'|'hard'>('easy');

  const loadQuestions = () => {
    const qs = storage.getQuizQuestions();
    setQuestions(qs);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleAddQuestion = () => {
    const options = adminOptions.split(',').map(s => s.trim()).filter(Boolean);
    if (!adminQuestion || options.length < 2) return;
    storage.addQuizQuestion({ question: adminQuestion, options, correctAnswer: adminCorrect, category: adminCategory, difficulty: adminDifficulty, tags: [] });
    setAdminQuestion(''); setAdminOptions(''); setAdminCorrect(0);
    loadQuestions();
  };

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setEditingQuestion(q.question);
    setEditingOptions(q.options.join(', '));
    setEditingCorrect(q.correctAnswer);
    setEditingDifficulty(q.difficulty || 'easy');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingQuestion('');
    setEditingOptions('');
    setEditingCorrect(0);
    setEditingDifficulty('easy');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const options = editingOptions.split(',').map(s => s.trim()).filter(Boolean);
    storage.updateQuizQuestion(editingId, { question: editingQuestion, options, correctAnswer: editingCorrect, difficulty: editingDifficulty });
    cancelEdit();
    loadQuestions();
  };

  const handleDeleteQuestion = (id: string) => {
    storage.deleteQuizQuestion(id);
    loadQuestions();
  };

  const handleSeed = () => {
    seedQuestions();
    loadQuestions();
  };

  if (!started) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Quiz</h1>

          <Card>
            <CardHeader>
              <CardTitle>Introdução</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Este é um MVP do motor de Quiz. Comece para responder perguntas aleatórias.</p>

              {/* Small Stats */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Tentativas</div>
                  <div className="text-lg font-semibold">
                    {storage.getQuizStats().totalAttempts}
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Média</div>
                  <div className="text-lg font-semibold">{storage.getQuizStats().averageScore} pts</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Melhor</div>
                  <div className="text-lg font-semibold">{storage.getQuizStats().bestScore} pts</div>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label htmlFor="filter-category" className="block text-sm font-medium">Categoria</label>
                  <select id="filter-category" className="input w-full" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {['all', ...Array.from(new Set(storage.getQuizQuestions().map(q => q.category)))].map(c => (
                      <option key={c} value={c}>{c === 'all' ? 'Todas' : c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-difficulty" className="block text-sm font-medium">Dificuldade</label>
                  <select id="filter-difficulty" className="input w-full" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                    {['any', 'easy', 'medium', 'hard'].map(d => (
                      <option key={d} value={d}>{d === 'any' ? 'Qualquer' : d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={start} className="gradient-primary text-white border-0">Começar</Button>
                  <Button onClick={handleSeed} variant={'outline'}>Semear Perguntas</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{questions.length} perguntas cadastradas.</p>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <label htmlFor="admin-question" className="block text-sm font-medium">Pergunta</label>
                  <input id="admin-question" className="w-full input" value={adminQuestion} onChange={(e) => setAdminQuestion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-options" className="block text-sm font-medium">Opções (separadas por vírgula)</label>
                  <input id="admin-options" className="w-full input" value={adminOptions} onChange={(e) => setAdminOptions(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="admin-correct" className="block text-sm font-medium">Índice da opção correta (0-based)</label>
                    <input id="admin-correct" type="number" className="input w-full" value={adminCorrect} onChange={(e) => setAdminCorrect(parseInt(e.target.value || '0'))} />
                  </div>
                  <div>
                    <label htmlFor="admin-difficulty" className="block text-sm font-medium">Dificuldade</label>
                    <select id="admin-difficulty" className="input w-full" value={adminDifficulty} onChange={(e) => setAdminDifficulty(e.target.value as any)}>
                      <option value={'easy'}>Fácil</option>
                      <option value={'medium'}>Médio</option>
                      <option value={'hard'}>Difícil</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddQuestion}>Adicionar Pergunta</Button>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium">Lista de perguntas:</p>
                  <div className="space-y-2 mt-2">
                    {questions.map(q => (
                      <div key={q.id} className="p-3 border rounded">
                        {editingId === q.id ? (
                          <div className="space-y-2">
                            <input className="w-full input" value={editingQuestion} onChange={(e) => setEditingQuestion(e.target.value)} />
                            <input className="w-full input" value={editingOptions} onChange={(e) => setEditingOptions(e.target.value)} placeholder={'op1, op2, op3'} />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="number" className="input" value={editingCorrect} onChange={(e) => setEditingCorrect(parseInt(e.target.value || '0'))} />
                              <select className="input" value={editingDifficulty} onChange={(e) => setEditingDifficulty(e.target.value as any)}>
                                <option value={'easy'}>Fácil</option>
                                <option value={'medium'}>Médio</option>
                                <option value={'hard'}>Difícil</option>
                              </select>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <Button onClick={saveEdit}>Salvar</Button>
                              <Button variant={'outline'} onClick={cancelEdit}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{q.question}</div>
                              <div className="text-xs text-muted-foreground">{q.options.join(' — ')}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant={'outline'} size={'sm'} onClick={() => startEdit(q)}>Editar</Button>
                              <Button variant={'outline'} size={'sm'} onClick={() => handleDeleteQuestion(q.id)}>Excluir</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {storage.getQuizResults().slice(-5).reverse().map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="text-sm font-medium">{r.date}</div>
                      <div className="text-xs text-muted-foreground">{r.correctAnswers}/{r.totalQuestions} — {r.category}</div>
                    </div>
                    <div className="text-sm font-semibold">{r.score} pts</div>
                  </div>
                ))}
                {storage.getQuizResults().length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum resultado ainda.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const current = questions[currentIndex];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Quiz</h1>
        <Card>
          <CardHeader>
            <CardTitle>Pergunta {currentIndex + 1} de {questions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{current.question}</p>
            <div className="grid gap-2">
              {current.options.map((opt, idx) => (
                <Button key={idx} onClick={() => answer(idx)}>{opt}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placar</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{score} pontos</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Quiz;