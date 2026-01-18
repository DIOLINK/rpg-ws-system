import { useState } from 'react';

export default function AssignCharacterModal({
  open,
  onClose,
  characters,
  onAssign,
}) {
  const [selected, setSelected] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">
          Selecciona un personaje para asociar a la partida
        </h2>
        <select
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">-- Selecciona tu personaje --</option>
          {characters.map((char) => (
            <option key={char._id} value={char._id}>
              {char.name} ({char.classType})
            </option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 bg-gray-600 rounded text-white"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${
              !selected ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600'
            }`}
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onAssign(selected);
              onClose();
            }}
          >
            Asociar y Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
