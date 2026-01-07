import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Plus, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Edit,
  Trash2,
  Filter,
  BarChart3
} from 'lucide-react';
import { Flashcard } from '@/types';
import { storage } from '@/lib/storage';
import { playClick, playSuccess, playFail } from '@/lib/sound';

export const FlashcardSystem = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '', category: 'Geral', difficulty: 'medium' as 'easy' | 'medium' | 'hard' });
  const [filterCategory, setFilterCategory] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'category'>('none');

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = () => {
    const cards = storage.getFlashcards();
    setFlashcards(cards);
  };

  const handleCreateCard = () => {
    if (newCard.question.trim() && newCard.answer.trim()) {
      storage.addFlashcard(newCard);
      setNewCard({ question: '', answer: '', category: 'Geral', difficulty: 'medium' });
      setIsCreating(false);
      loadFlashcards();
    }
  };

  const handleReview = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (cardsForReview.length === 0) return;

    const currentCard = cardsForReview[currentCardIndex % cardsForReview.length];

    const result = difficulty === 'easy' ? 'easy' : difficulty === 'medium' ? 'good' : 'hard';

    storage.scheduleReviewResult(currentCard.id, result as 'again' | 'hard' | 'good' | 'easy');

    // sounds
    playClick();
    if (result === 'easy') playSuccess();
    else if (result === 'hard') playFail();

    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev + 1) % Math.max(1, cardsForReview.length));
    loadFlashcards();
  };

  const filteredCards = filterCategory === 'all' 
    ? flashcards 
    : flashcards.filter(card => card.category === filterCategory);

  const allDue = storage.getDueFlashcards();
  const cardsForReview = filterCategory === 'all'
    ? allDue
    : allDue.filter(card => card.category === filterCategory);

  const categories = [...new Set(flashcards.map(card => card.category))];

  if (flashcards.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span>Flashcards Inteligentes</span>
            <Badge variant="secondary">0 cards</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-6 rounded-lg text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-blue-500 opacity-50" />
            <h3 className="text-lg font-semibold">Comece criando seu primeiro flashcard!</h3>
            <p className="text-sm text-muted-foreground">
              Crie cards para revisar conceitos importantes usando o algoritmo de repetição espaçada.
            </p>
          </div>
          
          {isCreating ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newCard.category}
                    onChange={(e) => setNewCard({...newCard, category: e.target.value})}
                    placeholder="Ex: Matemática, Inglês..."
                    className="bg-background"
                    data-testid="flashcard-new-category"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <select 
                    id="difficulty"
                    value={newCard.difficulty}
                    onChange={(e) => setNewCard({...newCard, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                    className="w-full p-2 border rounded-md bg-background"
                    data-testid="flashcard-new-difficulty"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="question">Pergunta</Label>
                <Textarea
                  id="question"
                  value={newCard.question}
                  onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                  placeholder="Digite a pergunta..."
                  rows={2}
                  className="bg-transparent"
                  data-testid="flashcard-new-question"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="answer">Resposta</Label>
                <Textarea
                  id="answer"
                  value={newCard.answer}
                  onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
                  placeholder="Digite a resposta..."
                  rows={3}
                  className="bg-transparent"
                  data-testid="flashcard-new-answer"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCreateCard} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Card
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button className="flex-1" onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <span>Flashcards Inteligentes</span>
          <Badge variant="secondary">{cardsForReview.length} para revisar</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros e Estatísticas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border rounded-md text-sm bg-background"
              data-testid="flashcard-filter-category"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'category')}
              className="p-2 border rounded-md text-sm bg-background"
              data-testid="flashcard-groupby"
            >
              <option value="none">Agrupar: Nenhum</option>
              <option value="category">Agrupar por Categoria</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <span>Total: {filteredCards.length}</span>
            <span>Para revisar: {cardsForReview.length}</span>
          </div>
        </div>

        {groupBy === 'category' && (
          <div className="flex flex-wrap gap-2 mt-2" data-testid="flashcard-groups">
            {categories.map(cat => (
              <Button key={cat} size="sm" variant={filterCategory === cat ? 'secondary' : 'ghost'} onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)} data-testid={`flashcard-group-${cat}`}>
                {cat} ({flashcards.filter(f => f.category === cat).length})
              </Button>
            ))}
          </div>
        )}

        {/* Creation form when there are existing cards */}
        {isCreating && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={newCard.category}
                  onChange={(e) => setNewCard({...newCard, category: e.target.value})}
                  placeholder="Ex: Matemática, Inglês..."
                  className="bg-transparent"
                  data-testid="flashcard-new-category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <select 
                  id="difficulty"
                  value={newCard.difficulty}
                  onChange={(e) => setNewCard({...newCard, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                  className="w-full p-2 border rounded-md bg-transparent"
                  data-testid="flashcard-new-difficulty"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="question">Pergunta</Label>
              <Textarea
                id="question"
                value={newCard.question}
                onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                placeholder="Digite a pergunta..."
                rows={2}
                className="bg-background"
                data-testid="flashcard-new-question"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer">Resposta</Label>
              <Textarea
                id="answer"
                value={newCard.answer}
                onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
                placeholder="Digite a resposta..."
                rows={3}
                className="bg-background"
                data-testid="flashcard-new-answer"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCreateCard} className="flex-1" data-testid="flashcard-create-button">
                <Plus className="h-4 w-4 mr-2" />
                Criar Card
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Card Atual */}
        {cardsForReview.length > 0 ? (
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="text-center space-y-4">
              <Badge variant="outline">{filteredCards[currentCardIndex % filteredCards.length]?.category}</Badge>
              
              <div className="min-h-[120px] flex items-center justify-center">
                <p className="text-xl font-medium text-center">
                  {showAnswer 
                    ? filteredCards[currentCardIndex % filteredCards.length]?.answer
                    : filteredCards[currentCardIndex % filteredCards.length]?.question
                  }
                </p>
              </div>
              
              <div className="flex justify-center space-x-2">
                {!showAnswer ? (
                  <Button onClick={() => setShowAnswer(true)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Mostrar Resposta
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleReview('hard')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Difícil
                    </Button>
                    <Button variant="outline" onClick={() => handleReview('medium')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Médio
                    </Button>
                    <Button variant="outline" onClick={() => handleReview('easy')}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Fácil
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 p-6 rounded-lg text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Parabéns! 🎉</h3>
            <p className="text-muted-foreground">
              Você revisou todos os cards para hoje. Novos cards estarão disponíveis amanhã.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex space-x-2">
          <Button className="flex-1" variant="outline" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Card
          </Button>
          <Button className="flex-1" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};