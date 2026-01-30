import PropTypes from 'prop-types';
import { useMemo } from 'react';
import TurnOrderMini from './TurnOrderMini';

/**
 * Barra de orden de turnos con integración de socket.
 * Adaptada para el nuevo sistema de iniciativa basado en dexterity.
 * @param {object} props
 * @param {array} props.turnOrder - Array de personajes en orden de turno (del servidor)
 * @param {number} props.currentTurnIndex - Índice del turno actual
 * @param {string} props.userId - ID del usuario actual
 * @param {boolean} props.combatStarted - Si el combate ha iniciado
 * @param {function} [props.onClickCharacter] - Acción al hacer clic en personaje (solo DM)
 */
export default function TurnOrderBar({
  turnOrder,
  currentTurnIndex,
  userId,
  combatStarted,
  onClickCharacter,
  characters = [],
}) {
  // Transformar el formato del servidor al formato del componente visual
  const displayOrder = useMemo(
    () =>
      turnOrder.map((entry, idx) => {
        const char = characters.find((c) => c._id === entry.characterId);
        const isYou = char && char.playerId === userId;
        return {
          id: entry.characterId,
          name: entry.name,
          initiative: entry.initiative,
          position: entry.position,
          isCurrent: idx === currentTurnIndex,
          isYou,
          isPlayer: !entry.isNPC,
          isNPC: entry.isNPC || false,
        };
      }),
    [turnOrder, currentTurnIndex, characters, userId],
  );

  if (!combatStarted || turnOrder.length === 0) {
    return (
      <div className="mb-4 flex justify-center">
        <div className="bg-gray-900/80 rounded-lg px-4 py-2 text-gray-500 text-sm">
          ⏳ Esperando inicio del combate...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex justify-center">
      <TurnOrderMini
        turnOrder={displayOrder}
        onClickCharacter={onClickCharacter}
      />
    </div>
  );
}

TurnOrderBar.propTypes = {
  turnOrder: PropTypes.arrayOf(
    PropTypes.shape({
      characterId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      name: PropTypes.string,
      initiative: PropTypes.number,
      position: PropTypes.number,
    }),
  ),
  currentTurnIndex: PropTypes.number,
  userId: PropTypes.string,
  combatStarted: PropTypes.bool,
  onClickCharacter: PropTypes.func,
};

TurnOrderBar.defaultProps = {
  turnOrder: [],
  currentTurnIndex: 0,
  combatStarted: false,
};
