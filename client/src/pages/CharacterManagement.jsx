import { useState } from 'react';
import AssignToGameModal from '../components/AssignToGameModal';
import CharacterForm from '../components/CharacterForm';
import CharacterList from '../components/CharacterList';
import { useCharacterManagement } from '../hooks/useCharacterManagement';

const CharacterManagement = () => {
  const {
    characters,
    loading,
    formCharacter,
    isEditing,
    editingId,
    addCharacter,
    editCharacter,
    saveEdit,
    deleteCharacter,
    sendToValidation,
    handleChange,
    handleCancel,
  } = useCharacterManagement();

  // Modal para asociar personaje a partida
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);

  const handleAssignToGame = (characterId) => {
    setSelectedCharacterId(characterId);
    setAssignModalOpen(true);
  };

  const handleAssignGameId = (gameId) => {
    if (gameId && selectedCharacterId) {
      window.location.href = `/game/${gameId}/assign-character`;
    }
  };
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <AssignToGameModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssignGameId}
      />
      <h1 className="text-2xl font-bold mb-4">Gestión de Personajes</h1>
      {loading && <div className="mb-4 text-blue-600">Cargando...</div>}
      {/* El error ya se notifica por toast, pero se puede dejar el mensaje visual si se desea */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {isEditing ? 'Editar Personaje' : 'Crear Nuevo Personaje'}
        </h2>
        <CharacterForm
          character={formCharacter}
          onChange={handleChange}
          onSave={isEditing ? saveEdit : addCharacter}
          onCancel={isEditing ? handleCancel : undefined}
          isEditing={isEditing}
          disabled={formCharacter.validated}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Lista de Personajes</h2>
        <CharacterList
          characters={characters}
          onEdit={editCharacter}
          onDelete={deleteCharacter}
          onSend={sendToValidation}
          onAssignToGame={handleAssignToGame}
          currentEditingId={editingId}
        />
      </div>
    </div>
  );
};

export default CharacterManagement;
