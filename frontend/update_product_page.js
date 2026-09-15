const fs = require('fs');
const file = '/Users/mac/Desktop/AppleWeb/frontend/src/pages/product/ProductPurchasePage.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update mappedProduct
code = code.replace(
  `            const mappedProduct = {
              id: dbProduct.id,
              slug: dbProduct.id,
              brand: dbProduct.category?.name || 'Samsung',`,
  `            const mappedProduct = {
              id: dbProduct.id,
              slug: dbProduct.id,
              brand: dbProduct.category?.name || 'Samsung',
              parentCategoryName: dbProduct.category?.parent?.name,
              parentCategorySlug: dbProduct.category?.parent?.slug,
              categoryName: dbProduct.category?.name,
              categorySlug: dbProduct.category?.slug,`
);

// Update Breadcrumb
const breadcrumbOld = `{/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/samsung" className="hover:text-blue-600 transition-colors">Điện thoại</Link>
          <span>/</span>
          <Link to={\`/brand/\${product.brand}\`} className="hover:text-blue-600 transition-colors capitalize">{product.brand}</Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium truncate">{product.name}</span>
        </nav>`;

const breadcrumbNew = `{/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-neutral-500 mb-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide font-medium">
          <Link to="/" className="hover:text-[#22c55e] transition-colors">Trang chủ</Link>
          {product.parentCategoryName && (
            <>
              <span className="text-neutral-300">/</span>
              <Link to={\`/\${product.parentCategorySlug}\`} className="hover:text-[#22c55e] transition-colors">{product.parentCategoryName}</Link>
            </>
          )}
          {product.categoryName && (
            <>
              <span className="text-neutral-300">/</span>
              <Link to={\`/\${product.categorySlug}\`} className="hover:text-[#22c55e] transition-colors">{product.categoryName}</Link>
            </>
          )}
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 truncate">{product.name}</span>
        </nav>`;

code = code.replace(breadcrumbOld, breadcrumbNew);

// Layout shift
const oldLayout = `{/* HERO SECTION */}
        <div className="grid items-start gap-8 lg:grid-cols-[55%_45%] lg:gap-12 mb-12">
          {/* LEFT COLUMN: Gallery */}
          <div className="min-w-0">
            <ProductGallery
              images={galleryImages}
              productName={product.name}
            />
          </div>

          {/* RIGHT COLUMN: Configurator & Purchase */}
          <div className="lg:sticky lg:top-24 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <ProductConfigurator
              product={product}
              selectedColorId={selectedColorId}
              selectedStorageId={selectedStorageId}
              selectedVariant={selectedVariant}
              quantity={quantity}
              maxQuantity={maxQuantity}
              onColorChange={setSelectedColorId}
              onStorageChange={setSelectedStorageId}
              onQuantityChange={setQuantity}
              onPurchase={handlePurchase}
            />
          </div>
        </div>
        
        {/* FULL WIDTH SECTIONS */}
        <div className="flex flex-col gap-8 w-full max-w-[1000px] mx-auto">
          {/* Description */}
          <ProductDescription description={product.description} />
          
          {/* Specifications */}
          <ProductSpecifications
            productName={product.name}
            specifications={product.specifications}
          />`;

const newLayout = `{/* HERO SECTION */}
        <div className="grid items-start gap-8 lg:grid-cols-[60%_40%] lg:gap-12 mb-12">
          {/* LEFT COLUMN: Gallery & Details */}
          <div className="min-w-0 flex flex-col gap-8">
            <ProductGallery
              images={galleryImages}
              productName={product.name}
            />
            
            {/* Description */}
            <ProductDescription description={product.description} />
            
            {/* Specifications */}
            <ProductSpecifications
              productName={product.name}
              specifications={product.specifications}
            />
          </div>

          {/* RIGHT COLUMN: Configurator & Purchase */}
          <div className="lg:sticky lg:top-24 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <ProductConfigurator
              product={product}
              selectedColorId={selectedColorId}
              selectedStorageId={selectedStorageId}
              selectedVariant={selectedVariant}
              quantity={quantity}
              maxQuantity={maxQuantity}
              onColorChange={setSelectedColorId}
              onStorageChange={setSelectedStorageId}
              onQuantityChange={setQuantity}
              onPurchase={handlePurchase}
            />
          </div>
        </div>
        
        {/* FULL WIDTH SECTIONS */}
        <div className="flex flex-col gap-8 w-full mx-auto">`;

code = code.replace(oldLayout, newLayout);

fs.writeFileSync(file, code);
console.log('Frontend product page layout updated');
