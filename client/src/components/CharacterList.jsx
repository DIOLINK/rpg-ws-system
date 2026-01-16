import CharacterActionsMenu from './CharacterActionsMenu';
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
          key={char._id}
          className={`p-4 border rounded flex flex-col md:flex-row md:justify-between md:items-center ${
            currentEditingId === char._id ? 'bg-blue-50' : ''
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
            <CharacterActionsMenu
              onEdit={() => onEdit(char._id)}
              onSend={() => onSend(char._id)}
              onDelete={() => onDelete(char._id)}
              disabledEdit={false}
              disabledSend={!!char.validated}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CharacterList;
