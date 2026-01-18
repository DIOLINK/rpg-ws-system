import { useState } from 'react';

export default function AssignToGameModal({ open, onClose, onAssign }) {
  const [gameId, setGameId] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">
          Ingresa el ID de la partida a la que quieres asociar este personaje
        </h2>
        <input
          className="w-full p-2 rounded mb-4 bg-gray-700 text-white"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="ID de la partida"
        />
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 bg-gray-600 rounded text-white"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-blue-600 rounded text-white disabled:bg-blue-900"
            disabled={!gameId}
            onClick={() => {
              onAssign(gameId);
              onClose();
            }}
          >
            Asociar
          </button>
        </div>
      </div>
    </div>
  );
}
