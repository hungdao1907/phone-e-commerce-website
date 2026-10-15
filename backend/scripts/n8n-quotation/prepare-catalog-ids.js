const source = $('Prepare Quote Filters').first().json;
const requests = source.requests || [];
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/([a-z])(\d)/g, '$1 $2').replace(/[^a-z0-9]+/g, ' ').trim();
let products = $input.all().flatMap(item => Array.isArray(item.json) ? item.json : item.json.products || item.json.data || (item.json.id ? [item.json] : []));
products = products.filter(p => p.status === 'active' && p.category?.isActive !== false);
const ids = [];
for (const request of requests) {
  const tokens = normalize(request.model).split(' ').filter(Boolean);
  let candidates = request.product_id ? products.filter(p => p.id === request.product_id)
    : products.filter(p => tokens.length && tokens.every(t => normalize(p.name).split(' ').includes(t))
      && (!request.brand || normalize(p.brand) === normalize(request.brand)));
  const exact = candidates.filter(p => normalize(p.name) === normalize(request.model));
  if (exact.length) candidates = exact;
  for (const p of candidates) if (!ids.includes(p.id)) ids.push(p.id);
}
return [{ json: { productIds: ids.slice(0, 12), products: [] } }];
