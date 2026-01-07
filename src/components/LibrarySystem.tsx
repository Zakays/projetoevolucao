import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Library, 
  BookOpen, 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Filter,
  Star,
  Calendar,
  Eye
} from 'lucide-react';
import { Book } from '@/types';
import { storage } from '@/lib/storage';

export const LibrarySystem = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    category: 'Geral',
    currentPage: 0,
    totalPages: 0,
    status: 'planned',
    rating: 0
  });

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = () => {
    const loadedBooks = storage.getBooks();
    setBooks(loadedBooks);
  };

  const handleCreateBook = () => {
    if (newBook.title?.trim() && newBook.author?.trim() && newBook.totalPages) {
      const bookToCreate = {
        title: newBook.title,
        author: newBook.author,
        category: newBook.category || 'Geral',
        currentPage: newBook.currentPage || 0,
        totalPages: newBook.totalPages,
        status: newBook.status || 'planned',
        rating: newBook.rating || 0
      };
      
      storage.addBook(bookToCreate);
      setNewBook({
        title: '',
        author: '',
        category: 'Geral',
        currentPage: 0,
        totalPages: 0,
        status: 'planned',
        rating: 0
      });
      setIsCreating(false);
      loadBooks();
    }
  };

  const handleUpdateBook = () => {
    if (isEditing && newBook.title?.trim() && newBook.author?.trim() && newBook.totalPages) {
      storage.updateBook(isEditing, newBook);
      setIsEditing(null);
      setNewBook({
        title: '',
        author: '',
        category: 'Geral',
        currentPage: 0,
        totalPages: 0,
        status: 'planned',
        rating: 0
      });
      loadBooks();
    }
  };

  const handleUpdateProgress = (bookId: string, currentPage: number) => {
    storage.updateBook(bookId, { currentPage });
    loadBooks();
  };

  const handleDeleteBook = (bookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este livro? Esta ação não pode ser desfeita.')) return;
    const deleted = storage.deleteBook(bookId);
    if (deleted) {
      loadBooks();
    } else {
      // Fallback visual caso o storage não remova
      const updatedBooks = books.filter(book => book.id !== bookId);
      setBooks(updatedBooks);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Book['status']) => {
    switch (status) {
      case 'reading': return 'Lendo';
      case 'completed': return 'Concluído';
      case 'paused': return 'Pausado';
      case 'planned': return 'Planejado';
      default: return status;
    }
  };

  const readingBooks = books.filter(book => book.status === 'reading');
  const completedBooks = books.filter(book => book.status === 'completed');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Library className="h-5 w-5 text-purple-500" />
          <span>Biblioteca Pessoal</span>
          <Badge variant="secondary">{books.length} livros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-blue-600">{readingBooks.length}</div>
            <div className="text-xs text-blue-600">Lendo</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-green-600">{completedBooks.length}</div>
            <div className="text-xs text-green-600">Concluídos</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-semibold text-purple-600">
              {books.reduce((total, book) => total + book.currentPage, 0)}
            </div>
            <div className="text-xs text-purple-600">Páginas lidas</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar livro ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded-md bg-background"
            data-testid="library-filter-select"
          >
            <option value="all">Todos</option>
            <option value="reading">Lendo</option>
            <option value="completed">Concluídos</option>
            <option value="paused">Pausados</option>
            <option value="planned">Planejados</option>
          </select>
        </div>

        {/* Formulário de Criação/Edição */}
        {(isCreating || isEditing) && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold">
              {isEditing ? 'Editar Livro' : 'Adicionar Novo Livro'}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  placeholder="Título do livro"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  placeholder="Autor"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={newBook.category}
                  onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                  placeholder="Categoria"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currentPage">Página Atual</Label>
                <Input
                  id="currentPage"
                  type="number"
                  value={newBook.currentPage}
                  onChange={(e) => setNewBook({...newBook, currentPage: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="totalPages">Total de Páginas</Label>
                <Input
                  id="totalPages"
                  type="number"
                  value={newBook.totalPages}
                  onChange={(e) => setNewBook({...newBook, totalPages: parseInt(e.target.value) || 0})}
                  placeholder="Total"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status"
                value={newBook.status}
                onChange={(e) => setNewBook({...newBook, status: e.target.value as Book['status']})}
                className="w-full p-2 border rounded-md bg-background"
                data-testid="library-status-select"
              >
                <option value="planned">Planejado</option>
                <option value="reading">Lendo</option>
                <option value="paused">Pausado</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
            
            {newBook.status === 'completed' && (
              <div className="space-y-1">
                <Label htmlFor="rating">Avaliação (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={newBook.rating}
                  onChange={(e) => setNewBook({...newBook, rating: parseInt(e.target.value) || 0})}
                  placeholder="1-5"
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={isEditing ? handleUpdateBook : handleCreateBook}
                className="flex-1"
              >
                {isEditing ? 'Atualizar' : 'Adicionar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(null);
                  setNewBook({
                    title: '',
                    author: '',
                    category: 'Geral',
                    currentPage: 0,
                    totalPages: 0,
                    status: 'planned',
                    rating: 0
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Livros */}
        {filteredBooks.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredBooks.map((book) => (
              <div key={book.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Badge variant="outline" className={getStatusColor(book.status)}>
                      {getStatusText(book.status)}
                    </Badge>
                    {book.rating > 0 && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{book.rating}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                {book.status === 'reading' && book.totalPages > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso: {book.currentPage}/{book.totalPages}</span>
                      <span>{Math.round((book.currentPage / book.totalPages) * 100)}%</span>
                    </div>
                    <Progress value={(book.currentPage / book.totalPages) * 100} />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateProgress(book.id, Math.max(0, book.currentPage - 10))}
                      >
                        -10
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateProgress(book.id, Math.min(book.totalPages, book.currentPage + 10))}
                      >
                        +10
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateProgress(book.id, book.totalPages)}
                      >
                        Concluir
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(book.id);
                      setNewBook(book);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteBook(book.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/50 p-6 rounded-lg text-center">
            <Library className="h-12 w-12 mx-auto text-purple-500 opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sua biblioteca está vazia</h3>
            <p className="text-muted-foreground mb-4">
              Adicione livros para acompanhar sua leitura e progresso.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex space-x-2">
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Livro
          </Button>
          <Button className="flex-1" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Buscar Livro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};