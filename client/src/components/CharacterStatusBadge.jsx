const CharacterStatusBadge = ({ validated, validationComment }) => {
  if (validated)
    return (
      <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs ml-2">
        Validado por el DM
      </span>
    );
  return (
    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs ml-2">
      Pendiente de validación
      {validationComment && (
        <span className="block text-xs text-gray-600 mt-1">
          {validationComment}
        </span>
      )}
    </span>
  );
};

export default CharacterStatusBadge;
