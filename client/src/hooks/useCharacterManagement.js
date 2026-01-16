import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { characterService } from '../services/characterService';

export const useCharacterManagement = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Para formulario
  const [formCharacter, setFormCharacter] = useState({
    name: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

  // Crear personaje
  const addCharacter = async () => {
    try {
      setLoading(true);
      const newChar = await characterService.create(
        formCharacter,
        localStorage.getItem('token')
      );
      setCharacters((chars) => [...chars, newChar]);
      setFormCharacter({ name: '', description: '' });
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
      setFormCharacter({ name: char.name, description: char.description });
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
        localStorage.getItem('token')
      );
      setCharacters((chars) =>
        chars.map((c) => (c._id === editingId ? updated : c))
      );
      setFormCharacter({ name: '', description: '' });
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
        localStorage.getItem('token')
      );
      setCharacters((chars) =>
        chars.map((c) => (c._id === id ? { ...c, validated: false } : c))
      );
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
    setFormCharacter({ name: '', description: '' });
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
  };
};
