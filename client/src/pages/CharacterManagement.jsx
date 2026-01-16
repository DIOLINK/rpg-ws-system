import { useState } from 'react';
import CharacterForm from '../components/CharacterForm';
import CharacterList from '../components/CharacterList';

// Lógica temporal local, luego se conectará a la API
const initialCharacters = [];

const CharacterManagement = () => {
  const [characters, setCharacters] = useState(initialCharacters);
  const [editingId, setEditingId] = useState(null);
  const [formCharacter, setFormCharacter] = useState({
    name: '',
    description: '',
    validated: false,
    validationComment: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Crear o guardar cambios
  const handleSave = () => {
    if (isEditing) {
      setCharacters((chars) =>
        chars.map((c) =>
          c.id === editingId ? { ...formCharacter, id: editingId } : c
        )
      );
      setIsEditing(false);
      setEditingId(null);
    } else {
      setCharacters((chars) => [
        ...chars,
        {
          ...formCharacter,
          id: Date.now(),
          validated: false,
          validationComment: '',
        },
      ]);
    }
    setFormCharacter({
      name: '',
      description: '',
      validated: false,
      validationComment: '',
    });
  };

  // Editar personaje
  const handleEdit = (id) => {
    const char = characters.find((c) => c.id === id);
    if (char && !char.validated) {
      setFormCharacter({
        name: char.name,
        description: char.description,
        validated: char.validated,
        validationComment: char.validationComment,
      });
      setEditingId(id);
      setIsEditing(true);
    }
  };

  // Eliminar personaje
  const handleDelete = (id) => {
    setCharacters((chars) => chars.filter((c) => c.id !== id));
    if (editingId === id) {
      setIsEditing(false);
      setEditingId(null);
      setFormCharacter({
        name: '',
        description: '',
        validated: false,
        validationComment: '',
      });
    }
  };

  // Enviar personaje a validación
  const handleSend = (id) => {
    setCharacters((chars) =>
      chars.map((c) => (c.id === id ? { ...c, validated: true } : c))
    );
    if (editingId === id) {
      setIsEditing(false);
      setEditingId(null);
      setFormCharacter({
        name: '',
        description: '',
        validated: false,
        validationComment: '',
      });
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormCharacter((f) => ({ ...f, [name]: value }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormCharacter({
      name: '',
      description: '',
      validated: false,
      validationComment: '',
    });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestión de Personajes</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {isEditing ? 'Editar Personaje' : 'Crear Nuevo Personaje'}
        </h2>
        <CharacterForm
          character={formCharacter}
          onChange={handleChange}
          onSave={handleSave}
          onCancel={isEditing ? handleCancel : undefined}
          isEditing={isEditing}
          disabled={formCharacter.validated}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Lista de Personajes</h2>
        <CharacterList
          characters={characters}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSend={handleSend}
          currentEditingId={editingId}
        />
      </div>
    </div>
  );
};

export default CharacterManagement;
