'use client';

import { useState, useCallback } from 'react';

interface ProductData {
  id: string;
  outfitImage: string | null;
  outfitImageFile: File | null;
  gender: string;
  colors: string;
  outfitType: string;
  graphicText: string;
  designElements: string;
  productName: string;
  productSlug: string;
  productDescription: string;
  category: string;
  subcategory: string;
  tags: string[];
  modelPoses: {
    standing: { prompt: string; image: string | null };
    sitting: { prompt: string; image: string | null };
    walking: { prompt: string; image: string | null };
  };
  status: 'draft' | 'ready' | 'exported';
}

const initialProductData: ProductData = {
  id: '',
  outfitImage: null,
  outfitImageFile: null,
  gender: 'Women',
  colors: '',
  outfitType: '',
  graphicText: '',
  designElements: '',
  productName: '',
  productSlug: '',
  productDescription: '',
  category: '',
  subcategory: '',
  tags: [],
  modelPoses: {
    standing: { prompt: '', image: null },
    sitting: { prompt: '', image: null },
    walking: { prompt: '', image: null },
  },
  status: 'draft',
};

export default function CatalogueEditorPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductData>({ ...initialProductData, id: crypto.randomUUID() });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'catalogue' | 'export'>('editor');

  // Handle outfit image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setCurrentProduct(prev => ({
        ...prev,
        outfitImage: base64,
        outfitImageFile: file,
      }));

      // Auto-analyze image
      setLoading(true);
      setLoadingStep('Analyzing outfit image with AI...');
      
      try {
        const base64Data = base64.split(',')[1];
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-image',
            data: {
              imageBase64: base64Data,
              mimeType: file.type,
            },
          }),
        });

        const result = await response.json();
        if (result.success) {
          setCurrentProduct(prev => ({
            ...prev,
            gender: result.data.gender || prev.gender,
            outfitType: result.data.outfitType || '',
            colors: Array.isArray(result.data.colors) ? result.data.colors.join(', ') : result.data.colors || '',
            graphicText: result.data.graphicText || '',
            designElements: result.data.designElements || '',
          }));
        }
      } catch (error) {
        console.error('Image analysis failed:', error);
      }
      
      setLoading(false);
      setLoadingStep('');
    };
    reader.readAsDataURL(file);
  }, []);

  // Generate product details
  const generateProductDetails = async () => {
    setLoading(true);
    setLoadingStep('Generating product name and description...');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-product-details',
          data: {
            gender: currentProduct.gender,
            colors: currentProduct.colors,
            outfitType: currentProduct.outfitType,
            graphicText: currentProduct.graphicText,
            designElements: currentProduct.designElements,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentProduct(prev => ({
          ...prev,
          productName: result.data.productName || '',
          productSlug: result.data.productSlug || '',
          productDescription: result.data.productDescription || '',
          category: result.data.category || prev.gender,
          subcategory: result.data.subcategory || prev.outfitType,
          tags: result.data.tags || [],
        }));
      }
    } catch (error) {
      console.error('Failed to generate product details:', error);
    }

    setLoading(false);
    setLoadingStep('');
  };

  // Generate model pose prompts
  const generateModelPoses = async () => {
    setLoading(true);
    setLoadingStep('Generating model pose prompts...');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-model-poses',
          data: {
            gender: currentProduct.gender,
            outfitDescription: `${currentProduct.outfitType} ${currentProduct.designElements}`,
            colors: currentProduct.colors,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        const poses = result.data;
        setCurrentProduct(prev => ({
          ...prev,
          modelPoses: {
            standing: { prompt: poses[0]?.prompt || '', image: null },
            sitting: { prompt: poses[1]?.prompt || '', image: null },
            walking: { prompt: poses[2]?.prompt || '', image: null },
          },
        }));
      }
    } catch (error) {
      console.error('Failed to generate poses:', error);
    }

    setLoading(false);
    setLoadingStep('');
  };

  // Add product to catalogue
  const addToCatalogue = () => {
    if (!currentProduct.productName || !currentProduct.outfitImage) {
      alert('Please add an image and generate product details first');
      return;
    }

    setProducts(prev => [...prev, { ...currentProduct, status: 'ready' }]);
    setCurrentProduct({ ...initialProductData, id: crypto.randomUUID() });
    setActiveTab('catalogue');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'product_name',
      'product_slug',
      'product_description',
      'category',
      'subcategory',
      'gender',
      'colors',
      'outfit_type',
      'tags',
      'standing_pose_prompt',
      'sitting_pose_prompt',
      'walking_pose_prompt',
      'status',
    ];

    const rows = products.map(p => [
      `"${p.productName.replace(/"/g, '""')}"`,
      p.productSlug,
      `"${p.productDescription.replace(/"/g, '""')}"`,
      p.category,
      p.subcategory,
      p.gender,
      `"${p.colors}"`,
      p.outfitType,
      `"${p.tags.join(', ')}"`,
      `"${p.modelPoses.standing.prompt.replace(/"/g, '""')}"`,
      `"${p.modelPoses.sitting.prompt.replace(/"/g, '""')}"`,
      `"${p.modelPoses.walking.prompt.replace(/"/g, '""')}"`,
      p.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_catalogue_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export folder structure info
  const exportFolderStructure = () => {
    const structure = products.map(p => ({
      folderName: p.productSlug,
      files: [
        `${p.productSlug}/outfit.jpg`,
        `${p.productSlug}/model-standing.jpg`,
        `${p.productSlug}/model-sitting.jpg`,
        `${p.productSlug}/model-walking.jpg`,
      ],
      prompts: {
        standing: p.modelPoses.standing.prompt,
        sitting: p.modelPoses.sitting.prompt,
        walking: p.modelPoses.walking.prompt,
      },
    }));

    const json = JSON.stringify(structure, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folder_structure_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">📦 Product Catalogue Editor</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'editor' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              ➕ Editor
            </button>
            <button
              onClick={() => setActiveTab('catalogue')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'catalogue' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              📋 Catalogue ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'export' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              📤 Export
            </button>
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lg">{loadingStep}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Image Upload & Preview */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">📸 Outfit Image</h2>
                
                {currentProduct.outfitImage ? (
                  <div className="relative">
                    <img
                      src={currentProduct.outfitImage}
                      alt="Outfit"
                      className="w-full max-h-96 object-contain rounded-lg bg-gray-700"
                    />
                    <button
                      onClick={() => setCurrentProduct(prev => ({ ...prev, outfitImage: null, outfitImageFile: null }))}
                      className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="text-4xl mb-4">📤</div>
                    <p className="text-gray-400">Click to upload outfit image</p>
                    <p className="text-sm text-gray-500 mt-2">AI will auto-analyze the image</p>
                  </label>
                )}
              </div>

              {/* Model Pose Prompts */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">🎭 Model Pose Prompts</h2>
                  <button
                    onClick={generateModelPoses}
                    disabled={!currentProduct.outfitType}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors text-sm"
                  >
                    Generate Prompts
                  </button>
                </div>

                {['standing', 'sitting', 'walking'].map((pose) => (
                  <div key={pose} className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                      {pose} Pose
                    </label>
                    <textarea
                      value={currentProduct.modelPoses[pose as keyof typeof currentProduct.modelPoses].prompt}
                      onChange={(e) => setCurrentProduct(prev => ({
                        ...prev,
                        modelPoses: {
                          ...prev.modelPoses,
                          [pose]: { ...prev.modelPoses[pose as keyof typeof prev.modelPoses], prompt: e.target.value }
                        }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm resize-none"
                      placeholder={`Prompt for ${pose} pose...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Details Form */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">📝 Product Details</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                    <select
                      value={currentProduct.gender}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    >
                      <option value="Women">Women</option>
                      <option value="Men">Men</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Outfit Type</label>
                    <input
                      type="text"
                      value={currentProduct.outfitType}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, outfitType: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      placeholder="T-Shirt, Dress, etc."
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Colors</label>
                  <input
                    type="text"
                    value={currentProduct.colors}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, colors: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Black, White, Red..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Graphic/Print Text</label>
                  <input
                    type="text"
                    value={currentProduct.graphicText}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, graphicText: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Any text on the clothing"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Design Elements</label>
                  <input
                    type="text"
                    value={currentProduct.designElements}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, designElements: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Stripes, floral, embroidery..."
                  />
                </div>

                <button
                  onClick={generateProductDetails}
                  disabled={!currentProduct.outfitType || !currentProduct.colors}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors mb-6"
                >
                  ✨ Generate Product Name & Description
                </button>

                {/* Generated Details */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Product Name <span className="text-gray-500">({currentProduct.productName.length}/100)</span>
                    </label>
                    <input
                      type="text"
                      value={currentProduct.productName}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, productName: e.target.value.slice(0, 100) }))}
                      maxLength={100}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Slug</label>
                    <input
                      type="text"
                      value={currentProduct.productSlug}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, productSlug: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg font-mono text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description <span className="text-gray-500">({currentProduct.productDescription.length}/500)</span>
                    </label>
                    <textarea
                      value={currentProduct.productDescription}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, productDescription: e.target.value.slice(0, 500) }))}
                      maxLength={500}
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                      <input
                        type="text"
                        value={currentProduct.category}
                        onChange={(e) => setCurrentProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={currentProduct.subcategory}
                        onChange={(e) => setCurrentProduct(prev => ({ ...prev, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                    <input
                      type="text"
                      value={currentProduct.tags.join(', ')}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                      placeholder="tag1, tag2, tag3..."
                    />
                  </div>
                </div>

                <button
                  onClick={addToCatalogue}
                  disabled={!currentProduct.productName || !currentProduct.outfitImage}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  ➕ Add to Catalogue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catalogue Tab */}
        {activeTab === 'catalogue' && (
          <div>
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">📦</p>
                <p className="text-gray-400">No products in catalogue yet</p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="mt-4 px-6 py-2 bg-blue-600 rounded-lg"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-gray-800 rounded-xl overflow-hidden">
                    {product.outfitImage && (
                      <img
                        src={product.outfitImage}
                        alt={product.productName}
                        className="w-full h-48 object-contain bg-gray-700"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.productName}</h3>
                      <p className="text-sm text-gray-400 mb-2">{product.category} / {product.subcategory}</p>
                      <p className="text-xs text-gray-500 line-clamp-3">{product.productDescription}</p>
                      <div className="mt-3 flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.status === 'ready' ? 'bg-green-600' : 'bg-yellow-600'
                        }`}>
                          {product.status}
                        </span>
                        <button
                          onClick={() => {
                            setProducts(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">📤 Export Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={exportToCSV}
                  disabled={products.length === 0}
                  className="p-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-xl text-left transition-colors"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">Export CSV</div>
                  <div className="text-sm text-green-200">For Directus import</div>
                </button>

                <button
                  onClick={exportFolderStructure}
                  disabled={products.length === 0}
                  className="p-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-xl text-left transition-colors"
                >
                  <div className="text-2xl mb-2">📁</div>
                  <div className="font-semibold">Export Folder Structure</div>
                  <div className="text-sm text-purple-200">JSON with prompts & paths</div>
                </button>
              </div>
            </div>

            {/* Directus Upload Guide */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Directus Upload Plan</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-400 mb-2">Step 1: Prepare Folder Structure</h3>
                  <p className="text-gray-300 text-sm">
                    Each product gets its own folder named with the product-slug. Inside each folder:
                  </p>
                  <ul className="text-gray-400 text-sm mt-2 list-disc list-inside">
                    <li><code>outfit.jpg</code> - Original outfit image</li>
                    <li><code>model-standing.jpg</code> - Generated standing pose</li>
                    <li><code>model-sitting.jpg</code> - Generated sitting pose</li>
                    <li><code>model-walking.jpg</code> - Generated walking pose</li>
                  </ul>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-400 mb-2">Step 2: Generate Model Images</h3>
                  <p className="text-gray-300 text-sm">
                    Use the exported prompts with an AI image generator (Midjourney, DALL-E, Stable Diffusion) to create model poses for each outfit.
                  </p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-400 mb-2">Step 3: Upload to Cloudinary</h3>
                  <p className="text-gray-300 text-sm">
                    Upload all images to Cloudinary under <code>/products/[product-slug]/</code> folder structure. Note down the URLs.
                  </p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-400 mb-2">Step 4: Import CSV to Directus</h3>
                  <p className="text-gray-300 text-sm">
                    1. Go to Directus Admin Panel<br />
                    2. Navigate to Products collection<br />
                    3. Click Import → Upload CSV<br />
                    4. Map columns to Directus fields<br />
                    5. Review and confirm import
                  </p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-400 mb-2">Step 5: Update Image URLs</h3>
                  <p className="text-gray-300 text-sm">
                    After import, update each product with Cloudinary URLs for:
                  </p>
                  <ul className="text-gray-400 text-sm mt-2 list-disc list-inside">
                    <li><code>product_image_url</code> - Main outfit image</li>
                    <li><code>model_image_1_url</code> - Standing pose</li>
                    <li><code>model_image_2_url</code> - Sitting pose</li>
                    <li><code>model_image_3_url</code> - Walking pose</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Products Summary */}
            {products.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">📊 Export Preview ({products.length} products)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3">Product Name</th>
                        <th className="text-left py-2 px-3">Category</th>
                        <th className="text-left py-2 px-3">Folder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-gray-700/50">
                          <td className="py-2 px-3 truncate max-w-xs">{p.productName}</td>
                          <td className="py-2 px-3">{p.category}/{p.subcategory}</td>
                          <td className="py-2 px-3 font-mono text-xs">{p.productSlug}/</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
