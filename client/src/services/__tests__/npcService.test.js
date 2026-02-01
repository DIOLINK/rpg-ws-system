describe('npcService', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockClear();
    vi.resetAllMocks();
  });

  // Mock apiFetch
  vi.mock('../../utils/apiFetch', () => ({
    apiFetch: vi.fn((url, opts) => {
      return Promise.resolve({
        json: () => Promise.resolve({ url, opts }),
      });
    }),
  }));

  it('getNPCTemplates llama a apiFetch y retorna json', async () => {
    const { getNPCTemplates } = await import('../npcService');
    const result = await getNPCTemplates();
    expect(result.url).toBe('/api/npc/templates');
  });

  it('createNPCTemplate llama a apiFetch con POST', async () => {
    const { createNPCTemplate } = await import('../npcService');
    const data = { name: 'Orco' };
    const result = await createNPCTemplate(data);
    expect(result.url).toBe('/api/npc/templates');
    expect(result.opts.method).toBe('POST');
  });

  it('updateNPCTemplate llama a apiFetch con PUT', async () => {
    const { updateNPCTemplate } = await import('../npcService');
    const result = await updateNPCTemplate('id1', { name: 'Goblin' });
    expect(result.url).toBe('/api/npc/templates/id1');
    expect(result.opts.method).toBe('PUT');
  });

  it('deleteNPCTemplate llama a apiFetch con DELETE', async () => {
    const { deleteNPCTemplate } = await import('../npcService');
    const result = await deleteNPCTemplate('id2');
    expect(result.url).toBe('/api/npc/templates/id2');
    expect(result.opts.method).toBe('DELETE');
  });

  it('spawnNPC llama a apiFetch con POST', async () => {
    const { spawnNPC } = await import('../npcService');
    const result = await spawnNPC('game1', 'tpl1', { hp: 10 });
    expect(result.url).toBe('/api/npc/spawn');
    expect(result.opts.method).toBe('POST');
  });

  it('getGameNPCs llama a apiFetch', async () => {
    const { getGameNPCs } = await import('../npcService');
    const result = await getGameNPCs('game1');
    expect(result.url).toBe('/api/npc/game/game1');
  });

  it('killNPC llama a apiFetch con POST', async () => {
    const { killNPC } = await import('../npcService');
    const result = await killNPC('npc1', ['p1', 'p2']);
    expect(result.url).toBe('/api/npc/npc1/kill');
    expect(result.opts.method).toBe('POST');
  });
});
