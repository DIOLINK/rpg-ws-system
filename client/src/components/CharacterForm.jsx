const CharacterForm = ({
  character,
  onChange,
  onSave,
  onCancel,
  isEditing,
  disabled,
}) => {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div>
        <label htmlFor="character-name" className="block font-semibold">
          Nombre
        </label>
        <input
          id="character-name"
          type="text"
          name="name"
          value={character.name}
          onChange={onChange}
          className="p-2 border rounded w-full"
          disabled={disabled}
          required
        />
      </div>
      <div>
        <label htmlFor="character-description" className="block font-semibold">
          Descripción
        </label>
        <textarea
          id="character-description"
          name="description"
          value={character.description}
          onChange={onChange}
          className="p-2 border rounded w-full"
          rows={3}
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="character-classType" className="block font-semibold">
          Clase
        </label>
        <select
          id="character-classType"
          name="classType"
          value={character.classType || ''}
          onChange={onChange}
          className="p-2 border rounded w-full"
          disabled={disabled}
          required
        >
          <option value="" disabled>
            Selecciona una clase
          </option>
          <option value="guerrero">Guerrero</option>
          <option value="mago">Mago</option>
          <option value="ladron">Ladrón</option>
          <option value="clerigo">Clérigo</option>
          <option value="explorador">Explorador</option>
        </select>
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={disabled}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Personaje'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default CharacterForm;
