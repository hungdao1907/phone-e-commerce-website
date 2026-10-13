const data = $json;
const requests = (data.requests || []).map(request => {
  const result = (data.request_results || []).find(r => r.request_index === request.request_index);
  return {...request, product_id:result?.product?.id || result?.resolved_product?.id || request.product_id,
    model:result?.product?.name || result?.resolved_product?.model || request.model,
    available_variants: (result?.available_variants || []).map(v => ({id:v.id,variant_id:v.variant_id,sku:v.sku,storage_gb:v.storage_gb,ram_gb:v.ram_gb,color:v.color}))};
});
return [{json:{session_id:data.sessionId,created_at:new Date().toISOString(),expires_at:Date.now()+30*60*1000,
  requests_json:JSON.stringify(requests),unresolved_indexes_json:JSON.stringify(data.unresolved_indexes || [])}}];
