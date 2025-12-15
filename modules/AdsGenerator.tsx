import React, { useState } from 'react';
import { Upload, RefreshCw, Share2, Wand2, Download, Save, Facebook, Image as ImageIcon, MessageSquare, Send, AlignLeft, AlignCenter, AlignJustify, Loader2 } from 'lucide-react';
import { StrategyAngle, AdCampaign } from '../types';
import { generateAdCopy, generateMarketingImage } from '../services/mockAiService';
import { saveAd, downloadText, downloadJSON } from '../services/persistence';

const AdsGenerator: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [strategy, setStrategy] = useState<StrategyAngle>(StrategyAngle.PAIN_VS_SOLUTION);
  const [textLength, setTextLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [description, setDescription] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  
  // Estados para corrección manual de imagen
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineText, setRefineText] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(URL.createObjectURL(e.target.files[0]));
      setGeneratedImage(null); // Reset generated image when new source is uploaded
      setShowRefineInput(false);
    }
  };

  const handleGenerate = async () => {
    if (!productName || !productImage) return;
    
    setIsGenerating(true);
    setGeneratedCopy(''); // Clear previous
    setGeneratedImage(null);
    setShowRefineInput(false);

    // 1. Generar Texto (Copy)
    const copy = await generateAdCopy(productName, price, strategy, description, textLength);
    setGeneratedCopy(copy);
    setIsGenerating(false);

    // 2. Generar Imagen basada en el Texto generado y la Estrategia
    await triggerImageGeneration(copy);
  };

  // Función específica para cambiar longitud sin borrar la imagen
  const handleLengthChange = async (newLength: 'short' | 'medium' | 'long') => {
    setTextLength(newLength);
    
    // Si ya tenemos datos, regeneramos solo el texto inmediatamente
    if (productName) {
        setIsGenerating(true); // Usamos el spinner de texto
        // No borramos la imagen (generatedImage se mantiene)
        try {
            const copy = await generateAdCopy(productName, price, strategy, description, newLength);
            setGeneratedCopy(copy);
        } catch (e) {
            console.error("Error regenerando texto", e);
        } finally {
            setIsGenerating(false);
        }
    }
  };

  const triggerImageGeneration = async (contextCopy: string, refinement?: string) => {
      if (!productImage) return;
      setIsGeneratingImage(true);
      try {
        // Pasamos la estrategia actual y opcionalmente la corrección manual
        const newImage = await generateMarketingImage(productImage, productName, contextCopy, strategy, refinement);
        setGeneratedImage(newImage);
        if (refinement) {
            setShowRefineInput(false);
            setRefineText('');
        }
      } catch (e) {
        console.error("Error generando imagen", e);
      } finally {
        setIsGeneratingImage(false);
      }
  };

  const handleRefreshImage = () => {
      if (generatedCopy && productImage) {
          triggerImageGeneration(generatedCopy);
      }
  };

  const handleRefreshText = async () => {
      if (!productName) return;
      setGeneratedCopy('');
      setIsGenerating(true);
      const copy = await generateAdCopy(productName, price, strategy, description, textLength);
      setGeneratedCopy(copy);
      setIsGenerating(false);
  };

  const handleManualRefinement = () => {
      if (refineText.trim() && generatedCopy) {
          triggerImageGeneration(generatedCopy, refineText);
      }
  };

  const handleSaveToDB = () => {
    if (!productName || !generatedCopy) return;
    
    const newAd: AdCampaign = {
        id: Date.now().toString(),
        productName,
        price,
        description: description,
        strategy,
        generatedCopy,
        generatedImage: generatedImage || productImage || '',
        createdAt: new Date()
    };
    
    saveAd(newAd);
    alert('Anuncio guardado en la base de datos local.');
  };

  const handleDownload = () => {
    if (!generatedCopy) return;
    const content = `PRODUCTO: ${productName}\nPRECIO: S/ ${price}\nESTRATEGIA: ${strategy}\n\nCOPY PARA REDES:\n${generatedCopy}`;
    downloadText(content, `Ad_${productName.replace(/\s+/g, '_')}.txt`);
  };

  const handleFacebookShare = () => {
    if (!generatedCopy) return;
    navigator.clipboard.writeText(generatedCopy);
    alert("¡Texto copiado! Se abrirá Facebook para que pegues tu anuncio.");
    window.open('https://www.facebook.com/', '_blank');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-slate-900">Generador de Ads</h2>
            <p className="text-slate-500">Crea publicidad de alto impacto optimizada para Meta (FB/IG).</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUTS */}
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Imagen del Producto</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer relative group">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
              {productImage ? (
                <img src={productImage} alt="Preview" className="h-48 object-contain" />
              ) : (
                <>
                  <Upload size={32} className="mb-2" />
                  <span className="text-sm">Arrastra o sube tu imagen aquí</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">La IA preservará la integridad de tu producto (No distorsiones).</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Producto</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Ej: Mini Proyector YG300"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio (Soles)</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="S/ 120.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estrategia Psicológica</label>
            <select 
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none mb-3"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as StrategyAngle)}
            >
              {Object.values(StrategyAngle).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="text-xs text-orange-500 mt-1 font-medium">
                {strategy === StrategyAngle.URGENCY && "⚠️ Generará textos de alerta y fotos rápidas."}
                {strategy === StrategyAngle.EXCLUSIVITY && "💎 Generará tono VIP y fotos de lujo oscuras."}
                {strategy === StrategyAngle.PAIN_VS_SOLUTION && "💊 Enfocará el problema y solución."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Producto / Detalles</label>
            <p className="text-xs text-slate-400 mb-2">Ingresa las características técnicas. La IA analizará esto para crear el mensaje de venta (no lo copiará).</p>
            <textarea 
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none h-32"
              placeholder="Ej: Calidad HD 1080P, portátil, entrada HDMI..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !productImage}
            className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${
              isGenerating || !productImage ? 'bg-slate-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Creando Campaña...
              </>
            ) : (
              <>
                <Wand2 size={20} /> Generar Ad Completo
              </>
            )}
          </button>
        </div>

        {/* PREVIEW */}
        <div className="flex flex-col items-center justify-start bg-slate-50 p-6 rounded-2xl">
           <div className="flex justify-between w-full max-w-sm mb-4">
               <h3 className="text-lg font-semibold text-slate-700">Vista Previa</h3>
               <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded border border-orange-200 uppercase tracking-wider">
                   {strategy}
               </span>
           </div>
           
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-sm w-full overflow-hidden">
              {/* Fake Header */}
              <div className="p-3 flex items-center gap-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">S</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Seiso Store</p>
                  <p className="text-xs text-slate-500">Publicidad</p>
                </div>
              </div>

              {/* Image Container with Refresh Button */}
              <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden group">
                
                {generatedCopy && productImage && !isGeneratingImage && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                        {/* Botón de Corrección Manual */}
                        <button 
                            onClick={() => setShowRefineInput(!showRefineInput)}
                            className={`p-2 rounded-full shadow-md transition-all ${showRefineInput ? 'bg-orange-500 text-white' : 'bg-white/80 hover:bg-white text-slate-600 hover:text-orange-500'}`}
                            title="Corregir manualmente (Magic Edit)"
                        >
                            <MessageSquare size={16} />
                        </button>
                        
                        {/* Botón Refrescar */}
                        <button 
                            onClick={handleRefreshImage}
                            className="bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-slate-600 hover:text-orange-500 transition-all"
                            title="Refrescar Imagen (Probar otro fondo)"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                )}

                {isGeneratingImage ? (
                     <div className="absolute inset-0 bg-slate-900/10 flex flex-col items-center justify-center z-0 backdrop-blur-[1px]">
                         <ImageIcon className="animate-pulse text-orange-500 mb-2" size={32} />
                         <span className="text-xs font-bold text-slate-600 bg-white/80 px-2 py-1 rounded">Generando fondo IA...</span>
                     </div>
                ) : null}

                {generatedImage ? (
                  <img src={generatedImage} alt="AI Generated Ad" className="w-full h-full object-cover" />
                ) : productImage ? (
                  <img src={productImage} alt="Original Product" className="w-full h-full object-contain p-4" />
                ) : (
                  <span className="text-slate-400 text-sm">Visualización aquí</span>
                )}
                
                {/* Manual Refinement Input Overlay */}
                {showRefineInput && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 p-3 z-20 animate-in slide-in-from-bottom-5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Corregir con IA</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                autoFocus 
                                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-orange-500"
                                placeholder="Ej: Haz el producto más grande, cambia el fondo a azul..."
                                value={refineText}
                                onChange={(e) => setRefineText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualRefinement()}
                            />
                            <button 
                                onClick={handleManualRefinement}
                                className="bg-orange-500 text-white p-1.5 rounded hover:bg-orange-600"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-3 flex gap-4 text-slate-700 border-b border-slate-50">
                <div className="hover:text-red-500 cursor-pointer">❤️</div>
                <div className="hover:text-blue-500 cursor-pointer">💬</div>
                <div className="hover:text-green-500 cursor-pointer">✈️</div>
              </div>

              {/* Text Length Toolbar */}
              <div className="px-3 py-2 flex items-center justify-end gap-1 border-b border-slate-50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-auto tracking-wide">Longitud Texto:</span>
                  <button 
                      onClick={() => handleLengthChange('short')}
                      className={`text-[10px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${textLength === 'short' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                      <AlignLeft size={10} /> Corta
                  </button>
                  <button 
                      onClick={() => handleLengthChange('medium')}
                      className={`text-[10px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${textLength === 'medium' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                      <AlignCenter size={10} /> Media
                  </button>
                  <button 
                      onClick={() => handleLengthChange('long')}
                      className={`text-[10px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${textLength === 'long' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                      <AlignJustify size={10} /> Larga
                  </button>
              </div>

              {/* Copy */}
              <div className="px-3 pb-4 pt-3 max-h-60 overflow-y-auto relative min-h-[100px]">
                {isGenerating ? (
                    <div className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center flex-col gap-2">
                         <Loader2 className="animate-spin text-orange-500" size={20} />
                         <span className="text-xs font-bold text-slate-400">Redactando...</span>
                    </div>
                ) : null}
                <p className="text-sm text-slate-800 whitespace-pre-line">
                  <span className="font-bold mr-2">Seiso Store</span>
                  {generatedCopy || "El copy generado por la IA aparecerá aquí...\n\nSerá breve, con gancho y emojis."}
                </p>
              </div>

              <div className="px-3 pb-3">
                 <button className="w-full bg-blue-500 text-white text-sm font-bold py-1.5 rounded">Comprar Ahora</button>
              </div>
           </div>

           {generatedCopy && (
            <div className="mt-6 flex flex-col gap-3 w-full max-w-sm">
                <div className="flex gap-3">
                    <button 
                        onClick={handleRefreshText}
                        className="flex-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={16} /> Re-escribir
                    </button>
                    <button 
                        onClick={handleFacebookShare}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Facebook size={16} /> Compartir
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={handleSaveToDB}
                        className="flex-1 border border-green-600 text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Guardar (Sesión)
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="flex-1 border border-slate-700 text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Guardar (PC)
                    </button>
                </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdsGenerator;