import React, { useEffect, useState, useRef } from 'react';
import { storage } from '@/lib/storage';

export interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

const defaultQuestions: Question[] = [
  {
    id: 'q1',
    question: 'Qual é a capital do Brasil?',
    options: ['São Paulo', 'Brasília', 'Rio de Janeiro', 'Belo Horizonte'],
    answerIndex: 1,
  },
  {
    id: 'q2',
    question: 'Quantos segundos tem um minuto?',
    options: ['30', '60', '90', '120'],
    answerIndex: 1,
  },
  {
    id: 'q3',
    question: 'Qual é o resultado de 3 + 4?',
    options: ['5', '6', '7', '8'],
    answerIndex: 2,
  },
];

interface MiniQuizProps {
  questions?: Question[];
  maxQuestions?: number;
}

const MiniQuiz: React.FC<MiniQuizProps> = ({ questions = defaultQuestions, maxQuestions }) => {
  const quizQuestions = maxQuestions ? questions.slice(0, maxQuestions) : questions;
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [category, setCategory] = useState<string>('general');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard' | 'any'>('any');
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (!started) return;
    intervalRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [started]);

  const start = () => {
    setStarted(true);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setCompleted(false);
    setElapsed(0);
    elapsedRef.current = 0;
    setUserAnswers([]);
  };

  const finish = () => {
    setCompleted(true);
    setStarted(false);
    // persist result to storage (map our local Question -> QuizQuestion shape expected by storage)
    const mappedQuestions = quizQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.answerIndex,
      category,
      difficulty: difficulty === 'any' ? 'medium' : difficulty,
      explanation: (q as any).explanation,
      tags: [],
    }));
    storage.addQuizResult({ score, totalQuestions: quizQuestions.length, correctAnswers: score, timeSpent: elapsed, category, difficulty: difficulty === 'any' ? 'medium' : difficulty, questions: mappedQuestions as any, userAnswers });
  };

  const selectOption = (idx: number) => {
    if (selected !== null) return; // don't allow changing
    setSelected(idx);
    setUserAnswers(u => [...u, idx]);
    if (idx === quizQuestions[current].answerIndex) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    const nextIdx = current + 1;
    if (nextIdx >= quizQuestions.length) {
      finish();
    } else {
      setCurrent(nextIdx);
      setSelected(null);
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setCompleted(false);
  };

  if (!started && !completed) {
    return (
      <div>
        <div className="space-y-2 mb-3">
          <label className="block text-sm">Categoria</label>
          <select aria-label="Categoria do MiniQuiz" value={category} onChange={(e) => setCategory(e.target.value)} className="input w-full">
            <option value="general">Geral</option>
            <option value="geografia">Geografia</option>
            <option value="matematica">Matemática</option>
            <option value="historia">História</option>
          </select>
        </div>
        <div className="space-y-2 mb-3">
          <label className="block text-sm">Dificuldade</label>
          <select aria-label="Dificuldade do MiniQuiz" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="input w-full">
            <option value="any">Qualquer</option>
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button aria-label="Iniciar Mini-Quiz" onClick={start} className="btn">
            Iniciar Mini-Quiz
          </button>
          <button aria-label="Sair MiniQuiz" onClick={reset} className="btn-outline">
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div>
        <div aria-live="polite">Você concluiu! Pontuação: {score}/{quizQuestions.length}</div>
        <div className="mt-2">
          <button aria-label="Reiniciar Mini-Quiz" onClick={reset} className="btn">
            Reiniciar
          </button>
        </div>
      </div>
    );
  }

  const q = quizQuestions[current];

  return (
    <div>
      <div className="font-semibold mb-2">Pergunta {current + 1}/{quizQuestions.length}</div>
      <div className="mb-4" role="heading" aria-level={3} aria-label={`pergunta-${q.id}`}>
        {q.question}
      </div>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === q.answerIndex;
          return (
            <button
              key={i}
              aria-pressed={isSelected}
              aria-label={`option-${i}`}
              onClick={() => selectOption(i)}
              className={`w-full p-2 rounded border text-left ${isSelected ? 'bg-accent/30' : ''}`}
            >
              {opt}
              {selected !== null && isCorrect ? <span className="ml-2"> — Correto</span> : null}
            </button>
          );
        })}
      </div>

      {/* explanation */}
      {selected !== null && q.explanation ? (
        <div className="mt-3 text-sm text-muted-foreground" role="note">{q.explanation}</div>
      ) : null}

      <div className="mt-4 flex space-x-2">
        <div className="flex-1 text-sm">Tempo: {elapsed}s</div>
        <div className="flex space-x-2">
          <button onClick={next} disabled={selected === null} aria-label="Próxima pergunta" className="btn">
            Próximo
          </button>
          <button onClick={reset} aria-label="Cancelar MiniQuiz" className="btn-outline">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniQuiz;
