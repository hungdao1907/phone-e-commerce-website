
const data = $('Format Quote Data').first().json;
const results = Array.isArray(data.request_results) ? data.request_results : [];
const productHints = results.flatMap(r => r.product?.id ? [{id:r.product.id,name:r.product.name}] : r.resolved_product?.id ? [{id:r.resolved_product.id,name:r.resolved_product.model}] : []);


function formatVND(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + '\u0111';
}

function formatStorage(gb) {
  if (gb === null || gb === undefined) return '';
  const num = Number(gb);
  if (!Number.isFinite(num)) return '';
  if (num === 2048) return '2TB';
  if (num === 1024) return '1TB';
  return `${num}GB`;
}

// AMBIGUOUS FOLLOWUP
if (data.ambiguous_followup && Array.isArray(data.ambiguous_products) && data.ambiguous_products.length > 0) {
  const prods = data.ambiguous_products.join(', ');
  return [
    {
      json: {
        result_type: 'quotation',
        response_type: 'text',
        success: false,
        quote_status: 'needs_variant_selection',
        ready_to_quote: false,
        response: `Bạn muốn áp dụng lựa chọn này cho sản phẩm nào? (${prods})`,
        request_results: results,
        products: productHints,
        chatInput: data.chatInput || '',
        sessionId: data.sessionId || '',
        source: data.source || 'web_chat'
      }
    }
  ];
}

// NEEDS VARIANT SELECTION
if (data.quote_status === 'needs_variant_selection') {
  const blocks = results
    .filter(item => item.status === 'needs_variant_selection')
    .map(item => {
      const productName = item.product?.name || item.requested?.model || 'sản phẩm';
      const variants = Array.isArray(item.available_variants) ? item.available_variants : [];

      if (variants.length === 0) {
        return `${productName}: hiện chưa có phiên bản phù hợp.`;
      }

      const ramSet = new Set(variants.map(v => v.ram_gb).filter(v => v !== null && v !== undefined));
      const storageSet = new Set(variants.map(v => v.storage_gb).filter(v => v !== null && v !== undefined));
      const colorSet = new Set(variants.map(v => v.color).filter(v => v !== null && v !== undefined && v !== ''));

      const ramVaries = ramSet.size > 1;
      const storageVaries = storageSet.size > 1;
      const colorVaries = colorSet.size > 1;

      function formatVariantPrice(variant) {
        const salePrice = Number(variant?.price);
        const originalPrice = Number(variant?.original_price);
        const saleText = formatVND(salePrice);
        if (Number.isFinite(originalPrice) && originalPrice > salePrice) {
          return `${saleText} (giá gốc ${formatVND(originalPrice)})`;
        }
        return saleText;
      }

      const lines = variants.map((variant, index) => {
        const parts = [];
        if (variant.ram_gb !== null && variant.ram_gb !== undefined) parts.push(`RAM ${variant.ram_gb}GB`);
        if (variant.storage_gb !== null && variant.storage_gb !== undefined) parts.push(formatStorage(variant.storage_gb));
        if (variant.color) parts.push(variant.color);
        const variantText = parts.join(' - ');
        return `${index + 1}. ${variantText} - ${formatVariantPrice(variant)}`;
      });

      let question = 'Bạn vui lòng chọn phiên bản muốn báo giá.';
      if (ramVaries && !storageVaries && !colorVaries) {
        const ramList = [...ramSet].sort((a, b) => a - b).map(r => `${r}GB`).join(' hoặc ');
        question = `Bạn vui lòng chọn RAM ${ramList}.`;
      } else if (colorVaries && !storageVaries && !ramVaries) {
        question = 'Bạn vui lòng chọn màu muốn báo giá.';
      } else if (storageVaries && !colorVaries && !ramVaries) {
        question = 'Bạn vui lòng chọn dung lượng muốn báo giá.';
      } else if (storageVaries && colorVaries && !ramVaries) {
        question = 'Bạn vui lòng chọn dung lượng và màu muốn báo giá.';
      } else if (ramVaries && storageVaries) {
        question = 'Bạn vui lòng chọn cấu hình RAM và dung lượng muốn báo giá.';
      }

      return (
        `${productName} hiện có ${variants.length} phiên bản:\n` +
        lines.join('\n') +
        `\n\n${question}`
      );
    });

  const response = blocks.join('\n\n');

  return [
    {
      json: {
        result_type: 'quotation',
        response_type: 'text',
        success: false,
        quote_status: 'needs_variant_selection',
        ready_to_quote: false,
        response,
        request_results: results,
        products: productHints,
        chatInput: data.chatInput || '',
        sessionId: data.sessionId || '',
        source: data.source || 'web_chat'
      }
    }
  ];
}

// NOT FOUND
if (data.quote_status === 'not_found') {
  return [
    {
      json: {
        result_type: 'quotation',
        response_type: 'text',
        success: false,
        quote_status: 'not_found',
        ready_to_quote: false,
        response: 'WebPhone chưa tìm thấy sản phẩm hoặc phiên bản phù hợp để tạo báo giá.',
        request_results: results,
        products: productHints,
        chatInput: data.chatInput || '',
        sessionId: data.sessionId || '',
        source: data.source || 'web_chat'
      }
    }
  ];
}

// INSUFFICIENT STOCK
if (data.quote_status === 'insufficient_stock') {
  const unavailable = results.filter(item => item.status === 'insufficient_stock');
  const details = unavailable.map(item => {
    const name = item.product?.name || item.requested?.model || 'Sản phẩm';
    if (item.quantity_requested !== undefined && item.stock_available !== undefined) {
      return `${name}: yêu cầu ${item.quantity_requested} chiếc, hiện còn ${item.stock_available} chiếc.`;
    }
    return `${name}: phiên bản phù hợp hiện không đủ hàng.`;
  });

  return [
    {
      json: {
        result_type: 'quotation',
        response_type: 'text',
        success: false,
        quote_status: 'insufficient_stock',
        ready_to_quote: false,
        response: 'Chưa thể tạo báo giá vì tồn kho không đủ.\n\n' + details.join('\n'),
        request_results: results,
        products: productHints,
        chatInput: data.chatInput || '',
        sessionId: data.sessionId || '',
        source: data.source || 'web_chat'
      }
    }
  ];
}

// INVALID REQUEST
return [
  {
    json: {
      result_type: 'quotation',
      response_type: 'text',
      success: false,
      quote_status: 'invalid_request',
      ready_to_quote: false,
      response: 'Bạn vui lòng cung cấp tên sản phẩm cần báo giá.',
      request_results: results,
        products: productHints,
      chatInput: data.chatInput || '',
      sessionId: data.sessionId || '',
      source: data.source || 'web_chat'
    }
  }
];
