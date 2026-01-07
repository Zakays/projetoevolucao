import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Play, 
  BarChart3, 
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Clock
} from 'lucide-react';
import { QuizQuestion, QuizResult } from '@/types';
import { storage } from '@/lib/storage';

// Banco de perguntas de exemplo
const sampleQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'Qual é a capital do Brasil?',
    options: ['Rio de Janeiro', 'Brasília', 'São Paulo', 'Salvador'],
    correctAnswer: 1,
    category: 'Geografia',
    difficulty: 'easy',
    tags: ['geografia', 'brasil', 'capitais']
  },
  {
    id: '2',
    question: 'Quem escreveu "Dom Casmurro"?',
    options: ['Machado de Assis', 'Carlos Drummond de Andrade', 'Jorge Amado', 'Clarice Lispector'],
    correctAnswer: 0,
    category: 'Literatura',
    difficulty: 'medium',
    tags: ['literatura', 'brasil', 'machado-de-assis']
  },
  {
    id: '3',
    question: 'Qual é o elemento químico mais abundante no universo?',
    options: ['Oxigênio', 'Carbono', 'Hidrogênio', 'Hélio'],
    correctAnswer: 2,
    category: 'Ciências',
    difficulty: 'medium',
    tags: ['química', 'ciências', 'elementos']
  },
  {
    id: '4',
    question: 'Em que ano o homem pisou na Lua pela primeira vez?',
    options: ['1965', '1969', '1972', '1958'],
    correctAnswer: 1,
    category: 'História',
    difficulty: 'easy',
    tags: ['história', 'espaço', 'nasa']
  },
  {
    id: '5',
    question: 'Qual é a fórmula química da água?',
    options: ['CO₂', 'NaCl', 'H₂O', 'O₂'],
    correctAnswer: 2,
    category: 'Ciências',
    difficulty: 'easy',
    tags: ['química', 'água', 'fórmulas']
  }
];

export const QuizSystem = () => {
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [quizStarted, quizCompleted]);

  const startQuiz = () => {
    // Seleciona 5 perguntas aleatórias
    const shuffled = [...sampleQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
    setCurrentQuiz(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizStarted(true);
    setQuizCompleted(false);
    setScore(0);
    setTimeSpent(0);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const currentQuestion = currentQuiz[currentQuestionIndex];
    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentQuestionIndex < currentQuiz.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  const finishQuiz = () => {
    setQuizCompleted(true);
    const result: QuizResult = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      score,
      totalQuestions: currentQuiz.length,
      correctAnswers: score,
      timeSpent,
      category: 'Conhecimentos Gerais',
      difficulty: 'medium',
      questions: currentQuiz,
      userAnswers: currentQuiz.map((_, index) => selectedAnswer || 0) // Simulação
    };
    
    setQuizResults(prev => [result, ...prev]);
  };

  const currentQuestion = currentQuiz[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;

  if (!quizStarted) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-green-500" />
            <span>Conhecimentos Gerais</span>
            <Badge variant="secondary">Quiz diário</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-6 rounded-lg text-center space-y-4">
            <GraduationCap className="h-12 w-12 mx-auto text-green-500 opacity-50" />
            <h3 className="text-lg font-semibold">Quiz Inteligente de Conhecimentos</h3>
            <p className="text-sm text-muted-foreground">
              Teste seus conhecimentos com perguntas de diversas áreas. 5 perguntas por quiz.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-600">Categorias</div>
              <div>Geografia, História, Ciências...</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-600">Dificuldade</div>
              <div>Fácil a Médio</div>
            </div>
          </div>
          
          <Button onClick={startQuiz} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Quiz de Hoje
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / currentQuiz.length) * 100);
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Quiz Concluído!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-6 rounded-lg text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            
            <div className="space-y-2">
              <div className="text-3xl font-bold">{percentage}%</div>
              <div className="text-lg">
                {score} de {currentQuiz.length} corretas
              </div>
              <div className="flex justify-center items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tempo: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {percentage >= 80 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Excelente!
                </Badge>
              )}
              {percentage >= 60 && percentage < 80 && (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                  Bom trabalho!
                </Badge>
              )}
              {percentage < 60 && (
                <Badge variant="default" className="bg-red-100 text-red-800">
                  Continue praticando!
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={startQuiz} className="flex-1" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Fazer Outro Quiz
            </Button>
            <Button className="flex-1" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estatísticas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-green-500" />
            <span>Quiz em Andamento</span>
          </div>
          <Badge variant="secondary">
            {currentQuestionIndex + 1}/{currentQuiz.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        
        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline">{currentQuestion?.category}</Badge>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeSpent}s</span>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-center">
            {currentQuestion?.question}
          </h3>
          
          <div className="space-y-2">
            {currentQuestion?.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === index ? "default" : "outline"}
                className={`w-full justify-start h-auto py-3 ${
                  showResult 
                    ? index === currentQuestion.correctAnswer
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : selectedAnswer === index && index !== currentQuestion.correctAnswer
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-50'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
              >
                <div className="flex items-center space-x-3">
                  {showResult && (
                    <>
                      {index === currentQuestion.correctAnswer && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </>
                  )}
                  <span>{option}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        {showResult && currentQuestion?.explanation && (
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <strong>Explicação:</strong> {currentQuestion.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );
};