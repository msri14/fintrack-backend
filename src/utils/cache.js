const cache = new Map();

exports.getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.data;
};

exports.setCache = (key, data, ttl = 60000) => {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
};