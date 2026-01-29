import CharacterActionsMenu from './CharacterActionsMenu';
import CharacterStatusBadge from './CharacterStatusBadge';

const CharacterList = ({
  characters,
  onEdit,
  onDelete,
  onSend,
  onAssignToGame,
  currentEditingId,
}) => {
  if (!characters.length) {
    return <p className="text-gray-500">No hay personajes creados.</p>;
  }
  return (
    <ul className="space-y-4">
      {characters.map((char) => (
        <li
          key={char._id}
          className={`p-4 border rounded flex items-center justify-between ${
            currentEditingId === char._id ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex-1 min-w-0">
            <span className="font-bold text-lg">{char.name}</span>
            <CharacterStatusBadge
              validated={char.validated}
              validationComment={char.validationComment}
            />
            <p className="text-sm text-gray-600 mt-1">{char.description}</p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <CharacterActionsMenu
              onEdit={() => onEdit(char._id)}
              onSend={() => onSend(char._id)}
              onDelete={() => onDelete(char._id)}
              onAssignToGame={() => onAssignToGame && onAssignToGame(char._id)}
              disabledEdit={false}
              disabledSend={!!char.validated}
              disabledAssign={!!char.gameId}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CharacterList;
