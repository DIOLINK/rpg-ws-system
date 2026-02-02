import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useToastStore from '../context/toastStore';
import {
  createNPCTemplate,
  deleteNPC,
  deleteNPCTemplate,
  getNPCTemplates,
  giveLoot,
  killNPC,
  spawnNPC,
} from '../services/npcService';
import { apiFetch } from '../utils/apiFetch';
import Collapsible from './Collapsible';

const NPC_TYPES = {
  enemy: { label: 'Enemigo', color: 'bg-red-600', icon: '👹' },
  miniboss: { label: 'Miniboss', color: 'bg-orange-600', icon: '👿' },
  boss: { label: 'Boss', color: 'bg-purple-600', icon: '💀' },
  neutral: { label: 'Neutral', color: 'bg-gray-600', icon: '🧔' },
  ally: { label: 'Aliado', color: 'bg-green-600', icon: '🤝' },
};

const STAT_FIELDS = [
  { key: 'hp', label: 'HP', max: 'maxHp' },
  { key: 'maxHp', label: 'HP Máx' },
  { key: 'mana', label: 'Maná', max: 'maxMana' },
  { key: 'maxMana', label: 'Maná Máx' },
  { key: 'strength', label: 'Fuerza' },
  { key: 'intelligence', label: 'Inteligencia' },
  { key: 'dexterity', label: 'Destreza' },
  { key: 'defense', label: 'Defensa' },
];

export default function NPCManager({ gameId, characters, onRefresh, socket }) {
  const { isDM } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [activeNPCs, setActiveNPCs] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spawn'); // 'spawn', 'active', 'create'
  const [showLootModal, setShowLootModal] = useState(false);
  const [lootData, setLootData] = useState(null);
  const [npcToDelete, setNpcToDelete] = useState(null); // Para el modal de confirmación
  const addToast = useToastStore((state) => state.addToast);

  // Form para crear plantilla
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    classType: 'Enemigo',
    icon: '👹',
    npcType: 'enemy',
    level: 1,
    expReward: 10,
    goldDrop: { min: 0, max: 0 },
    stats: {
      hp: 10,
      maxHp: 10,
      mana: 0,
      maxMana: 0,
      strength: 1,
      intelligence: 1,
      dexterity: 1,
      defense: 1,
    },
    abilities: [],
    inventory: [],
  });

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getNPCTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast({ message: 'Error al cargar plantillas', type: 'error' });
    }
  }, [addToast]);

  const loadActiveNPCs = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await apiFetch(`/api/npc/game/${gameId}`);
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Respuesta no es JSON válido:', e, res);
        setActiveNPCs([]);
        return;
      }

      if (!res.ok) {
        console.error('Error cargando NPCs:', res.status, data);
        setActiveNPCs([]);
        return;
      }

      setActiveNPCs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading NPCs:', error);
    }
  }, [gameId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadTemplates(), loadActiveNPCs()]);
      setLoading(false);
    };
    load();
  }, [loadTemplates, loadActiveNPCs]);

  // Crear NPC a partir de plantilla
  const handleSpawnNPC = async (template) => {
    try {
      const npc = await spawnNPC(gameId, template._id);
      setActiveNPCs([...activeNPCs, npc]);
      addToast({ message: `${npc.name} ha aparecido`, type: 'success' });
      // Notificar via socket
      if (socket) {
        socket.emit('npc:spawned', { gameId, npc });
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      addToast({ message: 'Error al crear NPC', type: 'error' });
    }
  };

  // Matar NPC
  const handleKillNPC = async (npc) => {
    try {
      const result = await killNPC(npc._id);
      setLootData({ npc, ...result });
      setShowLootModal(true);
      await loadActiveNPCs();
      addToast({ message: `${npc.name} ha muerto`, type: 'info' });
      // Notificar via socket para actualizar orden de turnos
      if (socket) {
        socket.emit('npc:killed', {
          gameId,
          npcId: npc._id,
          loot: result.loot,
        });
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      addToast({ message: 'Error al matar NPC', type: 'error' });
    }
  };

  // Eliminar NPC (ahora solo ejecuta la acción, la confirmación es por modal)
  const handleDeleteNPC = async (npc) => {
    try {
      await deleteNPC(npc._id);
      setActiveNPCs(activeNPCs.filter((n) => n._id !== npc._id));
      addToast({ message: `${npc.name} eliminado`, type: 'info' });
      // Notificar via socket
      if (socket) {
        socket.emit('npc:deleted', { gameId, npcId: npc._id });
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      addToast({ message: 'Error al eliminar NPC', type: 'error' });
    }
  };

  // Añadir NPC al orden de turnos
  const handleAddToTurnOrder = (npc) => {
    if (socket) {
      socket.emit('dm:add-to-turn-order', { gameId, characterId: npc._id });
      addToast({
        message: `${npc.name} añadido al orden de turnos`,
        type: 'success',
      });
    } else {
      addToast({ message: 'Error: Socket no disponible', type: 'error' });
    }
  };

  // Crear nueva plantilla
  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      addToast({ message: 'El nombre es requerido', type: 'warning' });
      return;
    }
    try {
      const template = await createNPCTemplate(newTemplate);
      setTemplates([...templates, template]);
      setNewTemplate({
        name: '',
        description: '',
        classType: 'Enemigo',
        icon: '👹',
        npcType: 'enemy',
        level: 1,
        expReward: 10,
        goldDrop: { min: 0, max: 0 },
        stats: {
          hp: 10,
          maxHp: 10,
          mana: 0,
          maxMana: 0,
          strength: 1,
          intelligence: 1,
          dexterity: 1,
          defense: 1,
        },
        abilities: [],
        inventory: [],
      });
      addToast({ message: 'Plantilla creada', type: 'success' });
      setActiveTab('spawn');
    } catch (error) {
      addToast({ message: 'Error al crear plantilla', type: 'error' });
    }
  };

  // Eliminar plantilla
  const handleDeleteTemplate = async (template) => {
    if (template.isGlobal) {
      addToast({
        message: 'No puedes eliminar plantillas globales',
        type: 'warning',
      });
      return;
    }
    if (!confirm(`¿Eliminar plantilla ${template.name}?`)) return;
    try {
      await deleteNPCTemplate(template._id);
      setTemplates(templates.filter((t) => t._id !== template._id));
      addToast({ message: 'Plantilla eliminada', type: 'info' });
    } catch (error) {
      addToast({ message: 'Error al eliminar plantilla', type: 'error' });
    }
  };

  // Dar loot a personaje
  const handleGiveLoot = async (characterId) => {
    if (!lootData) return;
    try {
      const groupItems = (items) => {
        if (!Array.isArray(items)) return [];
        const map = new Map();
        for (const it of items) {
          const key = it.itemRef ? it.itemRef : it.name;
          const existing = map.get(key);
          if (existing) {
            existing.quantity = (existing.quantity || 0) + (it.quantity || 1);
          } else {
            map.set(key, { ...it, quantity: it.quantity || 1 });
          }
        }
        return Array.from(map.values()).map((it) => ({
          name: it.name,
          itemRef: it.itemRef,
          quantity: it.quantity,
          icon: it.icon,
          type: it.type,
          rarity: it.rarity,
          value: it.value,
        }));
      };

      const itemsToSend = groupItems(lootData.loot?.items || []);

      const payload = {
        npcId: lootData.npc._id,
        characterId,
        items: itemsToSend,
        gold: lootData.loot?.gold || 0,
      };
      console.log('[NPCManager] giveLoot payload:', payload);
      const res = await giveLoot(
        payload.npcId,
        payload.characterId,
        payload.items,
        payload.gold,
      );
      console.log('[NPCManager] giveLoot response:', res);
      if (!res || !res.ok) {
        const errMsg = res?.body?.message || `Status ${res?.status}`;
        addToast({ message: `Error al dar loot: ${errMsg}`, type: 'error' });
      } else {
        addToast({ message: 'Loot entregado', type: 'success' });
      }
      setShowLootModal(false);
      setLootData(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('handleGiveLoot error:', error);
      addToast({
        message: `Error al dar loot: ${error.message || error}`,
        type: 'error',
      });
    }
  };

  const renderTabs = () => (
    <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2">
      {[
        { id: 'spawn', label: '👹 Invocar NPC' },
        {
          id: 'active',
          label: `⚔️ Activos (${activeNPCs.filter((n) => !n.isDead).length})`,
        },
        { id: 'create', label: '➕ Crear Plantilla' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderSpawnTab = () => {
    const groupedTemplates = templates.reduce((acc, t) => {
      const type = t.npcType || 'enemy';
      if (!acc[type]) acc[type] = [];
      acc[type].push(t);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        {Object.entries(NPC_TYPES).map(([type, config]) => {
          const typeTemplates = groupedTemplates[type] || [];
          if (typeTemplates.length === 0) return null;

          return (
            <div key={type} className="bg-gray-800 rounded-lg p-3">
              <h4
                className={`${config.color} text-white px-2 py-1 rounded text-sm font-bold mb-2 inline-block`}
              >
                {config.icon} {config.label}s
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {typeTemplates.map((template) => (
                  <div
                    key={template._id}
                    className="bg-gray-700 rounded p-2 flex items-center justify-between hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <p className="font-medium text-white">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Nv.{template.level} | HP:{template.stats.maxHp} | Exp:
                          {template.expReward}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      {!template.isGlobal && (
                        <button
                          onClick={() => handleDeleteTemplate(template)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Eliminar plantilla"
                        >
                          🗑️
                        </button>
                      )}
                      <button
                        onClick={() => handleSpawnNPC(template)}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-medium"
                        title="Invocar"
                      >
                        ⚡
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderActiveTab = () => {
    const aliveNPCs = activeNPCs.filter((n) => !n.isDead);
    const deadNPCs = activeNPCs.filter((n) => n.isDead);
    console.log('[NPCManager] NPCs activos:', aliveNPCs);
    console.log('[NPCManager] NPCs muertos:', deadNPCs);

    return (
      <div className="space-y-4">
        {/* NPCs Vivos */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="text-green-400 font-bold mb-2">
            ⚔️ NPCs en Combate ({aliveNPCs.length})
          </h4>
          {aliveNPCs.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay NPCs activos</p>
          ) : (
            <div className="space-y-2">
              {aliveNPCs.map((npc) => (
                <Collapsible
                  key={npc._id}
                  title={
                    <span>
                      {npc.npcIcon || '👹'} {npc.name}
                    </span>
                  }
                  defaultOpen={false}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{npc.npcIcon || '👹'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{npc.name}</span>
                        <span
                          className={`${NPC_TYPES[npc.npcType]?.color || 'bg-gray-600'} text-xs px-1.5 py-0.5 rounded`}
                        >
                          {NPC_TYPES[npc.npcType]?.label || 'NPC'}
                        </span>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-red-400">
                          ❤️ {npc.stats.hp}/{npc.stats.maxHp}
                        </span>
                        {npc.stats.maxMana > 0 && (
                          <span className="text-blue-400">
                            💧 {npc.stats.mana}/{npc.stats.maxMana}
                          </span>
                        )}
                        <span className="text-yellow-400">
                          💰 {npc.gold || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToTurnOrder(npc)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                      title="Añadir a orden de turnos"
                    >
                      🎯
                    </button>
                    <button
                      onClick={() => setSelectedNPC(npc)}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                      title="Ver ficha"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleKillNPC(npc)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                      title="Matar (dropea loot)"
                    >
                      ☠️
                    </button>
                    <button
                      onClick={() => setNpcToDelete(npc)}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                      title="Eliminar sin loot"
                    >
                      🗑️
                    </button>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </div>

        {/* NPCs Muertos */}
        {deadNPCs.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3">
            <h4 className="text-gray-400 font-bold mb-2">
              💀 NPCs Muertos ({deadNPCs.length})
            </h4>
            <div className="space-y-2">
              {deadNPCs.map((npc) => (
                <Collapsible
                  key={npc._id}
                  title={
                    <span className="grayscale">
                      {npc.npcIcon || '👹'} {npc.name}
                    </span>
                  }
                  defaultOpen={false}
                >
                  <div className="flex items-center gap-2 mb-2 opacity-60">
                    <span className="text-xl grayscale">
                      {npc.npcIcon || '👹'}
                    </span>
                    <span className="text-gray-400 line-through">
                      {npc.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setNpcToDelete(npc)}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                  >
                    🗑️ Eliminar
                  </button>
                </Collapsible>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCreateTab = () => (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl">
      {/* Plantillas de NPC */}
      <Collapsible title="📦 Plantillas de NPC" defaultOpen>
        {/* ...contenido de plantillas de NPC... */}
      </Collapsible>

      {/* NPCs activos */}
      <Collapsible title="👾 NPCs Activos" defaultOpen>
        {/* ...contenido de NPCs activos... */}
      </Collapsible>

      {/* Crear nueva plantilla */}
      <Collapsible title="➕ Crear Plantilla de NPC">
        {/* ...formulario de creación de plantilla... */}
      </Collapsible>
    </div>
  );

  // Modal detalles de plantilla
  const renderTemplateModal = () => {
    if (!selectedTemplate) return null;
    const t = selectedTemplate;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{t.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{t.name}</h3>
                <span
                  className={`${NPC_TYPES[t.npcType]?.color} text-xs px-2 py-0.5 rounded`}
                >
                  {NPC_TYPES[t.npcType]?.label} Nv.{t.level}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3">
            {t.description && (
              <p className="text-gray-300 text-sm italic">{t.description}</p>
            )}

            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-1">
                Estadísticas
              </h4>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="bg-gray-700 p-2 rounded text-center">
                  <span className="text-red-400">❤️</span>
                  <p className="font-bold">{t.stats.maxHp}</p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <span className="text-blue-400">💧</span>
                  <p className="font-bold">{t.stats.maxMana}</p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <span className="text-orange-400">⚔️</span>
                  <p className="font-bold">{t.stats.strength}</p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <span className="text-green-400">🛡️</span>
                  <p className="font-bold">{t.stats.defense}</p>
                </div>
              </div>
            </div>

            {t.abilities && t.abilities.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-1">
                  Habilidades
                </h4>
                <div className="space-y-1">
                  {t.abilities.map((a, i) => (
                    <div
                      key={i}
                      className="bg-gray-700 p-2 rounded text-sm flex justify-between"
                    >
                      <span>
                        {a.icon} {a.name}
                      </span>
                      <span className="text-red-400">{a.damage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {t.inventory && t.inventory.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-1">
                  Loot posible
                </h4>
                <div className="space-y-1">
                  {t.inventory.map((item, i) => (
                    <div
                      key={i}
                      className="bg-gray-700 p-2 rounded text-sm flex justify-between"
                    >
                      <span>
                        {item.icon} {item.name} x{item.quantity}
                      </span>
                      <span className="text-yellow-400">
                        {item.dropChance}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-400">
              <span>
                💰 Oro: {t.goldDrop.min}-{t.goldDrop.max}
              </span>
              <span>✨ Exp: {t.expReward}</span>
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => {
                handleSpawnNPC(t);
                setSelectedTemplate(null);
              }}
              className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded font-medium"
            >
              ⚡ Invocar {t.name}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal de NPC seleccionado
  const renderNPCModal = () => {
    if (!selectedNPC) return null;
    const npc = selectedNPC;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{npc.npcIcon || '👹'}</span>
              <div>
                <h3 className="font-bold text-lg">{npc.name}</h3>
                <span
                  className={`${NPC_TYPES[npc.npcType]?.color} text-xs px-2 py-0.5 rounded`}
                >
                  {NPC_TYPES[npc.npcType]?.label}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNPC(null)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-gray-400">HP</span>
                <p className="font-bold text-red-400">
                  {npc.stats.hp}/{npc.stats.maxHp}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-gray-400">Maná</span>
                <p className="font-bold text-blue-400">
                  {npc.stats.mana}/{npc.stats.maxMana}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-gray-400">Fuerza</span>
                <p className="font-bold text-orange-400">
                  {npc.stats.strength}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-gray-400">Defensa</span>
                <p className="font-bold text-green-400">{npc.stats.defense}</p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-gray-400">Int.</span>
                <p className="font-bold text-purple-400">
                  {npc.stats.intelligence}
                </p>
              </div>
              <div className="bg-gray-700 p-2 rounded">
                <span className="text-gray-400">Destreza</span>
                <p className="font-bold text-yellow-400">
                  {npc.stats.dexterity}
                </p>
              </div>
            </div>

            {/* Habilidades */}
            {npc.abilities && npc.abilities.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-1">
                  Habilidades
                </h4>
                {npc.abilities.map((a, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded text-sm mb-1">
                    <div className="flex justify-between">
                      <span>
                        {a.icon} {a.name}
                      </span>
                      <span className="text-red-400">{a.damage}</span>
                    </div>
                    {a.description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {a.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Inventario */}
            {npc.inventory && npc.inventory.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-1">
                  Inventario
                </h4>
                {npc.inventory.map((item, i) => (
                  <div
                    key={i}
                    className="bg-gray-700 p-2 rounded text-sm mb-1 flex justify-between"
                  >
                    <span>
                      {item.icon} {item.name}
                    </span>
                    <span className="text-gray-400">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-yellow-400">💰 {npc.gold || 0} oro</span>
              <span className="text-purple-400">✨ {npc.expReward} exp</span>
            </div>
          </div>

          <div className="p-4 border-t border-gray-700 flex gap-2">
            <button
              onClick={() => {
                handleKillNPC(npc);
                setSelectedNPC(null);
              }}
              className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded font-medium"
            >
              ☠️ Matar
            </button>
            <button
              onClick={() => setSelectedNPC(null)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal de loot
  const renderLootModal = () => {
    if (!showLootModal || !lootData) return null;

    // Defensive: lootData.loot puede ser undefined/null
    const loot = lootData.loot || { gold: 0, items: [] };
    const playerCharacters = characters?.filter((c) => !c.isNPC) || [];

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-lg text-yellow-400">
              💀 {lootData.npc.name} ha muerto
            </h3>
            <p className="text-sm text-gray-400">
              Experiencia: {lootData.exp} | Oro: {loot.gold}
            </p>
          </div>

          <div className="p-4 space-y-3">
            {Array.isArray(loot.items) && loot.items.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-2">
                  Items dropeados
                </h4>
                {(() => {
                  // Agrupar items iguales para mostrar cantidades consolidadas
                  const grouped = (loot.items || []).reduce((acc, it) => {
                    const key = it.itemRef || it.name;
                    if (!acc[key]) acc[key] = { ...it, quantity: 0 };
                    acc[key].quantity =
                      (acc[key].quantity || 0) + (it.quantity || 1);
                    return acc;
                  }, {});
                  return Object.values(grouped).map((item, i) => (
                    <div
                      key={i}
                      className="bg-gray-700 p-2 rounded text-sm mb-1 flex justify-between"
                    >
                      <span>
                        {item.icon} {item.name}
                      </span>
                      <span className="text-gray-400">x{item.quantity}</span>
                    </div>
                  ));
                })()}
              </div>
            )}

            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2">
                Dar loot a:
              </h4>
              <div className="space-y-1">
                {playerCharacters.map((char) => (
                  <button
                    key={char._id}
                    onClick={() => handleGiveLoot(char._id)}
                    className="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm text-left flex justify-between items-center"
                  >
                    <span>{char.name}</span>
                    <span className="text-green-400">✓ Dar</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => {
                setShowLootModal(false);
                setLootData(null);
              }}
              className="w-full bg-gray-600 hover:bg-gray-500 py-2 rounded font-medium"
            >
              Cerrar (sin dar loot)
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal de confirmación para eliminar NPC
  const renderDeleteNPCModal = () => {
    if (!npcToDelete) return null;
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-sm w-full">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-lg text-red-400">Eliminar NPC</h3>
            <p className="text-gray-300 text-sm mt-2">
              ¿Eliminar <span className="font-bold">{npcToDelete.name}</span>{' '}
              permanentemente?
            </p>
          </div>
          <div className="p-4 flex gap-2 border-t border-gray-700">
            <button
              onClick={() => setNpcToDelete(null)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                await handleDeleteNPC(npcToDelete);
                setNpcToDelete(null);
              }}
              className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded font-medium text-white"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTabs()}

      {isDM ? (
        <>
          {activeTab === 'spawn' && (
            <Collapsible title="👹 Invocar NPCs" defaultOpen>
              {renderSpawnTab()}
            </Collapsible>
          )}
          {activeTab === 'active' && (
            <Collapsible title="⚔️ NPCs Activos" defaultOpen>
              {renderActiveTab()}
            </Collapsible>
          )}
          {activeTab === 'create' && (
            <Collapsible title="➕ Crear Plantilla de NPC" defaultOpen>
              {renderCreateTab()}
            </Collapsible>
          )}
        </>
      ) : (
        <>
          {activeTab === 'spawn' && renderSpawnTab()}
          {activeTab === 'active' && renderActiveTab()}
          {activeTab === 'create' && renderCreateTab()}
        </>
      )}

      {renderTemplateModal()}
      {renderNPCModal()}
      {renderLootModal()}
      {renderDeleteNPCModal()}
    </div>
  );
}
