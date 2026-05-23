const VALID_PAGES = ['home', 'battle', 'mycollection'];

export function parseHash(hashValue = window.location.hash) {
  const hash = String(hashValue || '').replace(/^#/, '').trim();
  if (!hash) return { page: 'home' };
  if (VALID_PAGES.includes(hash)) return { page: hash };

  if (hash.startsWith('detail/')) {
    const id = Number(hash.split('/')[1]);
    if (Number.isFinite(id) && id > 0) return { page: 'home', detailId: id };
  }

  return { page: 'home' };
}

export function buildDetailHash(id) {
  return `detail/${id}`;
}
