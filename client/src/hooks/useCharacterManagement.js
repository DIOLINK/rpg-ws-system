import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import useToastStore from '../context/toastStore';
import { characterService } from '../services/characterService';
import { authService } from '../utils/authService';

export const useCharacterManagement = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const addToast = useToastStore((state) => state.addToast);
  const socket = useRef(null);

  // Para formulario
  const [formCharacter, setFormCharacter] = useState({
    name: '',
    description: '',
    classType: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Conectar socket para actualizaciones en tiempo real
  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
    const token = authService.getToken();

    if (!token || !user) return;

    socket.current = io(`${BASE_URL}`, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.current.on('connect', () => {
      console.log('🔌 Socket de personajes conectado');
      socket.current.emit('join-user-channel');
    });

    // Evento de validación de personaje
    socket.current.on(
      'character-validated',
      ({ characterId, validated, comment, characterName }) => {
        console.log('📥 character-validated:', { characterId, validated });
        setCharacters((prev) =>
          prev.map((char) =>
            char._id === characterId
              ? { ...char, validated, validationComment: comment }
              : char,
          ),
        );
        addToast({
          type: validated ? 'success' : 'warning',
          message: `${characterName} ha sido ${validated ? 'aprobado' : 'rechazado'} por el DM`,
        });
      },
    );

    // Evento de personaje actualizado
    socket.current.on('character-updated', (updatedData) => {
      console.log('📥 character-updated:', updatedData);
      setCharacters((prev) =>
        prev.map((char) => {
          if (
            char._id === updatedData.characterId ||
            char._id === updatedData._id
          ) {
            return {
              ...char,
              ...updatedData,
              // Mezclar stats correctamente si vienen en la actualización
              stats: updatedData.stats
                ? { ...char.stats, ...updatedData.stats }
                : char.stats,
            };
          }
          return char;
        }),
      );
    });

    // Evento de habilidad añadida
    socket.current.on('ability-added', ({ characterId, ability }) => {
      console.log('📥 ability-added:', { characterId, ability });
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, abilities: [...(char.abilities || []), ability] }
            : char,
        ),
      );
      addToast({
        type: 'info',
        message: `Nueva habilidad añadida: ${ability.name}`,
      });
    });

    // Evento de habilidad eliminada
    socket.current.on('ability-removed', ({ characterId, abilityId }) => {
      console.log('📥 ability-removed:', { characterId, abilityId });
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? {
                ...char,
                abilities: (char.abilities || []).filter(
                  (a) => a.id !== abilityId,
                ),
              }
            : char,
        ),
      );
    });

    // Evento de estado añadido
    socket.current.on('status-added', ({ characterId, status }) => {
      console.log('📥 status-added:', { characterId, status });
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, status: [...(char.status || []), status] }
            : char,
        ),
      );
      addToast({
        type: status.type === 'buff' ? 'success' : 'warning',
        message: `Estado añadido: ${status.name}`,
      });
    });

    // Evento de estado eliminado
    socket.current.on('status-removed', ({ characterId, statusId }) => {
      console.log('📥 status-removed:', { characterId, statusId });
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? {
                ...char,
                status: (char.status || []).filter((s) => s.id !== statusId),
              }
            : char,
        ),
      );
    });

    // Evento de actualización de inventario
    socket.current.on(
      'inventory-updated',
      ({ characterId, inventory, gold, itemData, action }) => {
        console.log('📦 inventory-updated:', { characterId, action, itemData });
        setCharacters((prev) =>
          prev.map((char) =>
            char._id === characterId
              ? {
                  ...char,
                  inventory: inventory || char.inventory,
                  gold: gold ?? char.gold,
                }
              : char,
          ),
        );
        // Mostrar notificación
        if (action === 'added' && itemData?.name) {
          addToast({
            type: 'success',
            message: `📦 Nuevo item: ${itemData.name}`,
          });
        } else if (action === 'removed' && itemData?.name) {
          addToast({
            type: 'info',
            message: `🗑️ Item eliminado: ${itemData.name}`,
          });
        } else if (action === 'gold-changed') {
          const amount = itemData?.amount || 0;
          addToast({
            type: amount > 0 ? 'success' : 'info',
            message: `💰 ${amount > 0 ? '+' : ''}${amount} oro`,
          });
        }
      },
    );

    // Evento de daño aplicado
    socket.current.on('damage-applied', ({ updates }) => {
      console.log('📥 damage-applied:', updates);
      setCharacters((prev) =>
        prev.map((char) => {
          const update = updates.find((u) => u.characterId === char._id);
          if (update) {
            return {
              ...char,
              stats: { ...char.stats, hp: update.hp },
              koWarning: update.koWarning,
            };
          }
          return char;
        }),
      );
    });

    // Evento de HP modificado
    socket.current.on(
      'hp-modified',
      ({ characterId, newHp, koWarning, isKO }) => {
        console.log('📥 hp-modified:', { characterId, newHp });
        setCharacters((prev) =>
          prev.map((char) =>
            char._id === characterId
              ? {
                  ...char,
                  stats: { ...char.stats, hp: newHp },
                  koWarning,
                  isKO,
                }
              : char,
          ),
        );
      },
    );

    // Evento de Mana modificado
    socket.current.on('mana-modified', ({ characterId, newMana }) => {
      console.log('📥 mana-modified:', { characterId, newMana });
      setCharacters((prev) =>
        prev.map((char) =>
          char._id === characterId
            ? { ...char, stats: { ...char.stats, mana: newMana } }
            : char,
        ),
      );
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [user, addToast]);

  // Cargar personajes al montar
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    characterService
      .getAll(localStorage.getItem('token'))
      .then(setCharacters)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Manejo de errores con toasts
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', message: error });
      setError(null); // Resetear error después de mostrar
    }
  }, [error, addToast]);

  // Crear personaje
  const addCharacter = async () => {
    try {
      setLoading(true);
      const newChar = await characterService.create(
        formCharacter,
        localStorage.getItem('token'),
      );
      setCharacters((chars) => [...chars, newChar]);
      setFormCharacter({ name: '', description: '', classType: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Editar personaje
  const editCharacter = (id) => {
    const char = characters.find((c) => c._id === id);
    if (char && !char.validated) {
      setFormCharacter({
        name: char.name,
        description: char.description,
        classType: char.classType || '',
      });
      setEditingId(id);
      setIsEditing(true);
    }
  };

  const saveEdit = async () => {
    try {
      setLoading(true);
      const updated = await characterService.update(
        editingId,
        formCharacter,
        localStorage.getItem('token'),
      );
      setCharacters((chars) =>
        chars.map((c) => (c._id === editingId ? updated : c)),
      );
      setFormCharacter({ name: '', description: '', classType: '' });
      setEditingId(null);
      setIsEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar personaje
  const deleteCharacter = async (id) => {
    try {
      setLoading(true);
      await characterService.remove(id, localStorage.getItem('token'));
      setCharacters((chars) => chars.filter((c) => c._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Enviar a validación
  const sendToValidation = async (id) => {
    try {
      setLoading(true);
      await characterService.sendToValidation(
        id,
        localStorage.getItem('token'),
      );
      // Refrescar personajes desde backend
      const updated = await characterService.getAll(
        localStorage.getItem('token'),
      );
      setCharacters(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Asociar personaje a partida
  const assignCharacterToGame = async (characterId, gameId) => {
    try {
      setLoading(true);
      await characterService.assignToGame(
        characterId,
        gameId,
        localStorage.getItem('token'),
      );
      // Refrescar personajes
      const updated = await characterService.getAll(
        localStorage.getItem('token'),
      );
      setCharacters(updated);
      addToast({
        type: 'success',
        message: 'Personaje asociado a la partida y enviado a validación.',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormCharacter((f) => ({ ...f, [name]: value }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormCharacter({ name: '', description: '', classType: '' });
  };

  return {
    characters,
    loading,
    error,
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
    assignCharacterToGame,
  };
};
