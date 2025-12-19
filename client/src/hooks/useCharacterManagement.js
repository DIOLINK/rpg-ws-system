import { useState } from 'react';

export const useCharacterManagement = () => {
  const [characters, setCharacters] = useState([]);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    class: '',
    level: 1,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCharacter({ ...newCharacter, [name]: value });
  };

  const addCharacter = () => {
    setCharacters([...characters, { ...newCharacter, id: Date.now() }]);
    setNewCharacter({ name: '', class: '', level: 1 });
  };

  const deleteCharacter = (id) => {
    setCharacters(characters.filter((char) => char.id !== id));
  };

  const editCharacter = (id) => {
    const characterToEdit = characters.find((char) => char.id === id);
    setNewCharacter(characterToEdit);
    deleteCharacter(id);
  };

  return {
    characters,
    newCharacter,
    handleInputChange,
    addCharacter,
    deleteCharacter,
    editCharacter,
  };
};
