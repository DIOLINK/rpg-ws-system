const classAbilities = {
  guerrero: [
    {
      id: 'slash',
      name: 'Corte Poderoso',
      description: 'Un ataque físico fuerte que inflige daño aumentado.',
      stat: 'strength',
      baseDamage: 10,
      manaCost: 0,
    },
    {
      id: 'defensive-stance',
      name: 'Postura Defensiva',
      description: 'Aumenta tu defensa durante 2 turnos.',
      stat: 'defense',
      baseDamage: 0,
      manaCost: 2,
    },
  ],
  mago: [
    {
      id: 'fireball',
      name: 'Bola de Fuego',
      description: 'Lanza una bola de fuego que inflige daño mágico.',
      stat: 'intelligence',
      baseDamage: 12,
      manaCost: 3,
    },
    {
      id: 'magic-shield',
      name: 'Escudo Mágico',
      description: 'Aumenta tu defensa mágica durante 2 turnos.',
      stat: 'defense',
      baseDamage: 0,
      manaCost: 2,
    },
  ],
  ladron: [
    {
      id: 'backstab',
      name: 'Puñalada',
      description:
        'Ataque rápido que inflige daño crítico si el enemigo está distraído.',
      stat: 'dexterity',
      baseDamage: 8,
      manaCost: 1,
    },
    {
      id: 'evasion',
      name: 'Evasión',
      description: 'Aumenta tu destreza y chance de esquivar durante 1 turno.',
      stat: 'dexterity',
      baseDamage: 0,
      manaCost: 1,
    },
  ],
  clerigo: [
    {
      id: 'heal',
      name: 'Curar',
      description: 'Restaura HP a un aliado.',
      stat: 'intelligence',
      baseDamage: 0,
      manaCost: 3,
    },
    {
      id: 'smite',
      name: 'Golpe Divino',
      description:
        'Ataque sagrado que inflige daño extra a enemigos no-muertos.',
      stat: 'strength',
      baseDamage: 9,
      manaCost: 2,
    },
  ],
  explorador: [
    {
      id: 'arrow-shot',
      name: 'Disparo de Flecha',
      description: 'Ataque a distancia con arco.',
      stat: 'dexterity',
      baseDamage: 7,
      manaCost: 1,
    },
    {
      id: 'animal-bond',
      name: 'Vínculo Animal',
      description: 'Invoca un animal aliado temporalmente.',
      stat: 'intelligence',
      baseDamage: 0,
      manaCost: 2,
    },
  ],
};
export default classAbilities;
