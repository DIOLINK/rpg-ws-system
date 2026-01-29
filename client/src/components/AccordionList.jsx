import { useState } from 'react';

/**
 * AccordionList: Componente apilable reutilizable para mostrar listas tipo acordeón.
 * Props:
 *  - items: Array de objetos { id, title, subtitle, content, icon }
 *  - renderContent: función para renderizar el contenido expandido (opcional)
 *  - className: clases extra para el contenedor (opcional)
 */
export default function AccordionList({
  items,
  renderContent,
  className = '',
}) {
  const [openId, setOpenId] = useState(null);

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <div key={item.id} className="bg-gray-700 rounded-lg">
          <button
            className="w-full flex items-center justify-between px-4 py-3 focus:outline-none hover:bg-gray-600 transition-colors rounded-lg"
            onClick={() => handleToggle(item.id)}
            aria-expanded={openId === item.id}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <span className="font-medium text-left">{item.title}</span>
              {item.subtitle && (
                <span className="ml-2 text-xs text-gray-400">
                  {item.subtitle}
                </span>
              )}
            </div>
            <span className="ml-2 text-gray-400">
              {openId === item.id ? '▲' : '▼'}
            </span>
          </button>
          {openId === item.id && (
            <div className="px-4 pb-4 pt-2 text-sm text-gray-200 animate-fade-in">
              {renderContent ? renderContent(item) : item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
