# Gestión de Personajes (Character Management)

Esta página permite a los usuarios crear, editar, eliminar y enviar personajes para validación del DM. El usuario puede:

- Crear un personaje con nombre y descripción.
- Editar personajes que aún no han sido validados por el DM.
- Eliminar cualquier personaje propio.
- Ver el estado de validación y comentarios del DM.
- Enviar personajes para validación del DM (una vez finalizada la edición).

## Componentes principales

- **CharacterManagement.jsx**: Página principal de ABM de personajes.
- **CharacterForm.jsx**: Formulario reutilizable para crear y editar personajes.
- **CharacterList.jsx**: Lista de personajes con acciones (editar, eliminar, enviar a validación).
- **CharacterStatusBadge.jsx**: Muestra el estado de validación del personaje.

## Flujo de usuario

1. El usuario ve la lista de sus personajes y su estado.
2. Puede crear un nuevo personaje o editar uno pendiente de validación.
3. Al finalizar la edición, puede enviar el personaje para validación del DM.
4. Si el personaje es validado, ya no puede editarlo, solo eliminarlo.
5. El usuario no podrá unirse a partidas si su personaje no está validado.

## Pendiente
- Conexión real con la API del servidor.
- Soporte para avatar e inventario.

---

Actualizado: 16/01/2026
