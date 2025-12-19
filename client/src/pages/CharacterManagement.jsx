import { useCharacterManagement } from '../hooks/useCharacterManagement';

const CharacterManagement = () => {
  const {
    characters,
    newCharacter,
    handleInputChange,
    addCharacter,
    deleteCharacter,
    editCharacter,
  } = useCharacterManagement();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestión de Personajes</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Crear Nuevo Personaje</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            value={newCharacter.name}
            onChange={handleInputChange}
            placeholder="Nombre"
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="class"
            value={newCharacter.class}
            onChange={handleInputChange}
            placeholder="Clase"
            className="p-2 border rounded"
          />
          <input
            type="number"
            name="level"
            value={newCharacter.level}
            onChange={handleInputChange}
            placeholder="Nivel"
            className="p-2 border rounded"
            min="1"
          />
          <button
            onClick={addCharacter}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Agregar Personaje
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Lista de Personajes</h2>
        {characters.length === 0 ? (
          <p className="text-gray-500">No hay personajes creados.</p>
        ) : (
          <ul className="space-y-4">
            {characters.map((char) => (
              <li
                key={char.id}
                className="p-4 border rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{char.name}</p>
                  <p className="text-sm text-gray-600">Clase: {char.class}</p>
                  <p className="text-sm text-gray-600">Nivel: {char.level}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editCharacter(char.id)}
                    className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteCharacter(char.id)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CharacterManagement;
