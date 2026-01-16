import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaEllipsisV, FaPaperPlane, FaTrash } from 'react-icons/fa';

const CharacterActionsMenu = ({
  onEdit,
  onDelete,
  onSend,
  disabledEdit,
  disabledSend,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        title="Más acciones"
        aria-label="Más acciones"
        type="button"
      >
        <FaEllipsisV className="text-xl text-gray-600 dark:text-gray-300" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-fade-in">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-yellow-600 rounded-t-lg disabled:opacity-50"
            title="Editar personaje"
            disabled={disabledEdit}
          >
            <FaEdit className="mr-2 text-yellow-600" /> Editar
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onSend && onSend();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-600 disabled:opacity-50"
            title="Enviar a validación"
            disabled={disabledSend}
          >
            <FaPaperPlane className="mr-2 text-green-600" /> Validación
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-600 rounded-b-lg"
            title="Eliminar personaje"
          >
            <FaTrash className="mr-2 text-red-600" /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterActionsMenu;
