/**
 * Componente compacto para mostrar el orden de turnos.
 * Props:
 *  - turnOrder: array de personajes [{ id, name, isPlayer, isCurrent, isYou, isNPC }]
 *  - onClickCharacter?: función opcional para manejar clic en personaje
 */
export default function TurnOrderMini({ turnOrder, onClickCharacter }) {
  return (
    <div className="bg-gray-900 rounded-lg px-3 py-2 flex items-center gap-2 shadow-md border border-gray-700">
      {turnOrder.map((char, idx) => (
        <button
          key={char.id}
          className={`flex flex-col items-center px-2 py-1 rounded transition-all
            ${char.isCurrent ? 'bg-purple-700 text-white scale-110 shadow-lg' : 'bg-gray-800 text-gray-300'}
            ${char.isYou ? 'ring-2 ring-green-400' : ''}
            ${char.isPlayer ? '' : 'opacity-80'}`}
          style={{ minWidth: 48 }}
          onClick={onClickCharacter ? () => onClickCharacter(char) : undefined}
          title={
            char.name +
            (char.isYou ? ' (Tú)' : '') +
            (char.isNPC ? ' (NPC)' : '')
          }
        >
          <span className="truncate text-xs font-bold max-w-[60px]">
            {char.name}
          </span>
          {char.isCurrent && <span className="text-xs mt-0.5">🎯</span>}
          {char.isYou && <span className="text-xs text-green-400">Tú</span>}
          {char.isNPC && (
            <span className="text-xs bg-purple-500 text-black px-1 rounded font-bold">
              NPC
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
