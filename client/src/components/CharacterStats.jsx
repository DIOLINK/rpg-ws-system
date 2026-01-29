/**
 * Componente para mostrar y editar los stats principales de un personaje.
 * Solo el DM puede editar los valores.
 * Props:
 *  - stats: { strength, intelligence, dexterity, defense }
 *  - equipmentBonuses: { strength, intelligence, dexterity, defense } (bonuses de items equipados)
 *  - editing: boolean (si está en modo edición)
 *  - onChange: function({ name, value }) (solo si editing)
 */
export default function CharacterStats({
  stats,
  equipmentBonuses = {},
  editing,
  onChange,
}) {
  const statList = [
    { label: '💪', name: 'strength' },
    { label: '🧠', name: 'intelligence' },
    { label: '⚡', name: 'dexterity' },
    { label: '🛡️', name: 'defense' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {statList.map((stat) => {
        const baseValue = stats[stat.name] || 0;
        const bonus = equipmentBonuses[stat.name] || 0;
        const total = baseValue + bonus;

        return (
          <div
            key={stat.name}
            className="bg-gray-700 rounded-lg p-3 text-center"
          >
            <div className="text-xl mb-1">{stat.label}</div>
            {editing ? (
              <input
                type="number"
                name={stat.name}
                value={stats[stat.name]}
                onChange={(e) =>
                  onChange({ name: stat.name, value: e.target.value })
                }
                className="w-full bg-gray-600 px-2 py-1 rounded text-center font-bold"
                min={0}
              />
            ) : bonus > 0 ? (
              <div className="text-lg font-bold text-center">
                <span className="text-gray-400">{baseValue}</span>
                <span className="text-green-700">+{bonus}</span>
                <span className="text-white ml-1">= {total}</span>
              </div>
            ) : bonus < 0 ? (
              <div className="text-lg font-bold text-center">
                <span className="text-gray-400">{baseValue}</span>
                <span className="text-red-700">{bonus}</span>
                <span className="text-white ml-1">= {total}</span>
              </div>
            ) : (
              <div className="text-lg font-bold">{baseValue}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
