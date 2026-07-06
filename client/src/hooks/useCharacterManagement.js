import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useToastStore from '../context/toastStore';
import { characterService } from '../services/characterService';

export const useCharacterManagement = () => {
  const { user } = useAuth();
  const { connected, characters, setCharacters } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const addToast = useToastStore((state) => state.addToast);

  // Form state
  const [formCharacter, setFormCharacter] = useState({
    name: '',
    description: '',
    classType: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load characters on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    characterService
      .getAll(localStorage.getItem('token'))
      .then(setCharacters)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Error toasts
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', message: error });
      setError(null);
    }
  }, [error, addToast]);

  // Create character
  const addCharacter = async () => {
    try {
      setLoading(true);
      const newChar = await characterService.create(formCharacter);
      setCharacters((chars) => [...chars, newChar]);
      setFormCharacter({ name: '', description: '', classType: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit character
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
      const updated = await characterService.update(editingId, formCharacter);
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

  // Delete character
  const deleteCharacter = async (id) => {
    try {
      setLoading(true);
      await characterService.remove(id);
      setCharacters((chars) => chars.filter((c) => c._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Send to validation
  const sendToValidation = async (id) => {
    try {
      setLoading(true);
      await characterService.sendToValidation(id);
      const updated = await characterService.getAll();
      setCharacters(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Assign character to game
  const assignCharacterToGame = async (characterId, gameId) => {
    try {
      setLoading(true);
      await characterService.assignToGame(characterId, gameId);
      const updated = await characterService.getAll();
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
