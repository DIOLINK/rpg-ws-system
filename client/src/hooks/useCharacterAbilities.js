import { useEffect, useState } from 'react';
import { classAbilityService } from '../services/classAbilityService';

/**
 * Hook para obtener las habilidades de un personaje.
 * Si el personaje tiene habilidades propias, retorna esas.
 * Si no, carga las habilidades base de la clase desde el backend.
 *
 * @param {object} character - Objeto personaje (debe tener classType y abilities)
 * @returns {object} { abilities, loading, error }
 */
export function useCharacterAbilities(character) {
  const [abilities, setAbilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    if (character.abilities && character.abilities.length > 0) {
      setAbilities(character.abilities);
      setLoading(false);
      return;
    }
    if (!character.classType) {
      setAbilities([]);
      setLoading(false);
      return;
    }
    classAbilityService
      .getByClassType(character.classType)
      .then((data) => {
        if (isMounted) setAbilities(data);
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [character.abilities, character.classType]);

  return { abilities, loading, error };
}
