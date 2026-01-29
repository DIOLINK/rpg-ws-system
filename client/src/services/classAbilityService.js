const API_URL = import.meta.env.VITE_API_URL || '';

export const classAbilityService = {
  async getByClassType(classType) {
    const res = await fetch(
      `${API_URL}/class-abilities?classType=${classType}`,
    );
    if (!res.ok) throw new Error('Error al obtener habilidades de clase');
    return res.json();
  },
};
