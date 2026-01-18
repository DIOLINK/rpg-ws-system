import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AssignCharacterModal from '../components/AssignCharacterModal';
import { useCharacterManagement } from '../hooks/useCharacterManagement';

export default function AssignCharacterPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { characters, assignCharacterToGame, loading } =
    useCharacterManagement();
  const [modalOpen, setModalOpen] = useState(true);

  // Permitir elegir cualquier personaje propio
  const availableCharacters = characters;

  // Redirigir si ya tiene un personaje asignado a esta partida
  // Validación de asignación se hará en el backend

  const handleAssign = async (characterId) => {
    // Llama al nuevo endpoint backend usando user autenticado
    try {
      await assignCharacterToGame(characterId, gameId);
      // Mostrar toast de éxito
      import('../context/toastStore').then(({ default: useToastStore }) => {
        useToastStore.getState().addToast({
          type: 'success',
          message: '¡Personaje asociado correctamente a la partida!',
        });
      });
      navigate(`/game/${gameId}`);
    } catch (e) {
      import('../context/toastStore').then(({ default: useToastStore }) => {
        useToastStore.getState().addToast({
          type: 'error',
          message: e.message || 'Error al asociar personaje',
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <AssignCharacterModal
        open={modalOpen}
        onClose={() => navigate('/lobby')}
        characters={availableCharacters}
        onAssign={handleAssign}
      />
      {loading && <div className="text-white mt-4">Procesando...</div>}
    </div>
  );
}
