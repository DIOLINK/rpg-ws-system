import CharacterStatusBadge from './CharacterStatusBadge';

const CharacterList = ({
  characters,
  onEdit,
  onDelete,
  onSend,
  currentEditingId,
}) => {
  if (!characters.length) {
    return <p className="text-gray-500">No hay personajes creados.</p>;
  }
  return (
    <ul className="space-y-4">
      {characters.map((char) => (
        <li
          key={char.id}
          className={`p-4 border rounded flex flex-col md:flex-row md:justify-between md:items-center ${
            currentEditingId === char.id ? 'bg-blue-50' : ''
          }`}
        >
          <div>
            <span className="font-bold text-lg">{char.name}</span>
            <CharacterStatusBadge
              validated={char.validated}
              validationComment={char.validationComment}
            />
            <p className="text-sm text-gray-600 mt-1">{char.description}</p>
          </div>
          <div className="flex space-x-2 mt-2 md:mt-0">
            {!char.validated && (
              <>
                <button
                  onClick={() => onEdit(char.id)}
                  className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => onSend(char.id)}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Enviar a Validación
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(char.id)}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CharacterList;
