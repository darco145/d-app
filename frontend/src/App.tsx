import { useState, useEffect } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [activities, setActivities] = useState([]);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTodos(data);
      } else {
        console.error('Backend nije vratio niz:', data);
        setTodos([]);
      }
    } catch (err) {
      console.error('Greška pri dohvatanju todo-a:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (Array.isArray(data)) {
        setActivities(data);
      } else {
        console.error('Backend nije vratio niz aktivnosti:', data);
        setActivities([]);
      }
    } catch (err) {
      console.error('Greška pri dohvatanju aktivnosti:', err);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchActivities();

    // Poling: poziva /api/activity na svakih 2000 ms (2 sekunde)
    const interval = setInterval(() => {
      fetchActivities();
    }, 2000);

    // Čišćenje intervala pri unmount-u komponente
    return () => clearInterval(interval);
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
      fetchActivities(); // Osvežavamo odmah i aktivnosti
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

      {/* Sekcija Aktivnost */}
      <hr style={{ margin: '30px 0' }} />
      <section className="activity-section">
        <h2>Aktivnost</h2>
        {activities.length === 0 ? (
          <p>Nema zabeleženih aktivnosti.</p>
        ) : (
          <ul className="activity-list">
            {activities.map((item) => (
              <li key={item.id} className="activity-item">
                <span>
                  Todo ID: <strong>#{item.todo_id}</strong> obrađen od strane{' '}
                  <strong>{item.processed_by}</strong> u{' '}
                  {new Date(item.processed_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}