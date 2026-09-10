import { useState, useEffect } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (Array.isArray(data)) {
            setTodos(data);
          } else {
            console.error('Backend nije vratio niz:', data);
            setTodos([]); // Sprečava pucanje aplikacije
          }
    } catch (err) {
      console.error('Greška pri dohvatanju todo-a:', err);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setNewTitle('');
        fetchTodos();
      }
    } catch (err) {
      console.error('Greška pri dodavanju:', err);
    }
  };

  const handleToggle = async (id, done) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !done }),
      });
      fetchTodos();
    } catch (err) {
      console.error('Greška pri izmeni statusa:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch (err) {
      console.error('Greška pri brisanju:', err);
    }
  };

  return (
    <div className="container">
      <h1>Todo Lista 2</h1>

      <form onSubmit={handleAdd} className="add-form">
        <input
          type="text"
          placeholder="Unesi novi todo..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit">Dodaj</button>
      </form>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            <span className={`todo-title ${todo.done ? 'completed' : ''}`}>
              {todo.title}
            </span>
            <div className="actions">
              <button
                className="btn-done"
                onClick={() => handleToggle(todo.id, todo.done)}
              >
                {todo.done ? 'Poništi' : 'Završeno'}
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(todo.id)}
              >
                Obriši
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
