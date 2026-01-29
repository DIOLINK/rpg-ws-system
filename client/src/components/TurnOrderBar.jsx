import { useMemo } from 'react';
import TurnOrderMini from './TurnOrderMini';

/**
 * Barra de orden de turnos con integración de socket.
 * @param {object} props
 * @param {array} props.turnOrder - Array de personajes en orden de turno
 * @param {number} props.currentTurn - Índice del turno actual
 * @param {string} props.userId - ID del usuario actual
 * @param {function} [props.onClickCharacter] - Acción al hacer clic en personaje
 */
export default function TurnOrderBar({
  turnOrder,
  currentTurn,
  userId,
  onClickCharacter,
}) {
  // Marca el personaje actual y el tuyo
  const displayOrder = useMemo(
    () =>
      turnOrder.map((char, idx) => ({
        ...char,
        isCurrent: idx === currentTurn,
        isYou: char.player?._id === userId,
        isPlayer: !!char.player,
      })),
    [turnOrder, currentTurn, userId],
  );

  return (
    <div className="mb-4 flex justify-center">
      <TurnOrderMini
        turnOrder={displayOrder}
        onClickCharacter={onClickCharacter}
      />
    </div>
  );
}
