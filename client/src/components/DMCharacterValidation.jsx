import { useEffect, useState } from 'react';

// Este componente muestra la lista de personajes pendientes de validación para el DM
const DMCharacterValidation = () => {
  const [pendingCharacters, setPendingCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Reemplazar con llamada real a la API para obtener personajes pendientes
    async function fetchPendingCharacters() {
      setLoading(true);
      setError(null);
      try {
        // Ejemplo de fetch, reemplazar por endpoint real
        const res = await fetch('/api/characters/pending');
        if (!res.ok) throw new Error('Error al obtener personajes');
        const data = await res.json();
        setPendingCharacters(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPendingCharacters();
  }, []);

  const handleValidation = async (characterId, approved, comment) => {
    // TODO: Llamar a la API para aprobar/rechazar personaje
    try {
      const res = await fetch(`/api/characters/validate/${characterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, comment }),
      });
      if (!res.ok) throw new Error('Error al validar personaje');
      // Eliminar personaje de la lista local
      setPendingCharacters((prev) => prev.filter((c) => c._id !== characterId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div>Cargando personajes pendientes...</div>;
  if (error) return <div>Error: {error}</div>;
  if (pendingCharacters.length === 0)
    return <div>No hay personajes pendientes de validación.</div>;

  return (
    <div>
      <h2>Personajes pendientes de validación</h2>
      {pendingCharacters.map((char) => (
        <div
          key={char._id}
          style={{ border: '1px solid #ccc', margin: '1em 0', padding: '1em' }}
        >
          <h3>
            {char.name} (Jugador: {char.playerName || char.playerId})
          </h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(char, null, 2)}
          </pre>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const comment = form.comment.value;
              const approved = form.approved.value === 'true';
              handleValidation(char._id, approved, comment);
            }}
          >
            <label>
              Comentario (opcional):
              <input name="comment" type="text" style={{ width: '100%' }} />
            </label>
            <div style={{ marginTop: '0.5em' }}>
              <button
                type="submit"
                name="approved"
                value="true"
                style={{ marginRight: '1em' }}
              >
                Aprobar
              </button>
              <button type="submit" name="approved" value="false">
                Rechazar
              </button>
            </div>
          </form>
        </div>
      ))}
    </div>
  );
};

export default DMCharacterValidation;
