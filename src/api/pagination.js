export const responseRoot = (response) => response?.data?.data ?? response?.data ?? {};

export const extractItems = (response, keys = []) => {
  const root = responseRoot(response);
  if (Array.isArray(root)) return root;
  for (const key of keys) if (Array.isArray(root?.[key])) return root[key];
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root?.content)) return root.content;
  return [];
};

export const paginationMeta = (response) => {
  const root = responseRoot(response);
  return root?.pagination || root?.meta || root?.pageInfo || root || {};
};

export const fetchAllPages = async (fetchPage, keys = [], { limit = 100, maxPages = 100 } = {}) => {
  const all = [];
  const seen = new Set();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchPage(page, limit);
    const batch = extractItems(response, keys);
    if (!batch.length) break;

    let added = 0;
    for (const item of batch) {
      const id = item?._id ?? item?.id;
      const key = id ? String(id) : JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(item);
      added += 1;
    }

    if (added === 0) break;

    const meta = paginationMeta(response);
    // The backend now returns a reliable boolean `hasNext`. Stop when it is
    // explicitly false; otherwise continue so every page is collected.
    if (meta && meta.hasNext === false) break;
    if (page === maxPages) break;
  }
  return all;
};
