import React, { useState } from 'react';
import { Film, Play, Clock, Video, FileText, Music, Download, Save, Upload, Wand2, Loader2, DollarSign, LayoutTemplate, AlignLeft, Image as ImageIcon, Copy } from 'lucide-react';
import { VideoSegment, SavedVideoProject } from '../types';
import { generateViralVideoScript, generateSunoPrompt, regenerateSlideImage } from '../services/mockAiService';
import { saveVideoProject, downloadJSON } from '../services/persistence';

const VideoArchitect: React.FC = () => {
  // Product Data
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [videoStrategy, setVideoStrategy] = useState('Problema-Solución');

  // App State
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sunoPrompt, setSunoPrompt] = useState('');
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});

  const strategies = [
      { id: 'Cinematic 3D', label: '🎬 Video Cinematográfico 3D', desc: 'Revelación de producto estilo 3D Premium (E-commerce).' },
      { id: 'Cinematic Lifestyle', label: '🎥 Estilo de Vida (Lifestyle)', desc: 'Uso aspiracional con actores reales y estética cine.' },
      { id: 'Presentación de Producto', label: '✨ Presentación de Producto', desc: 'Showcase estético y visual.' },
      { id: 'Problema-Solución', label: '🛠️ Problema vs Solución', desc: 'El clásico gancho viral.' },
      { id: 'Exclusividad', label: '💎 Exclusividad / Lujo', desc: 'Tono premium y aspiracional.' },
      { id: 'Escasez Urgencia', label: '🔥 Escasez y Urgencia', desc: 'Ideal para ofertas flash.' },
      { id: 'Personalizado', label: '🧠 Estrategia Personalizada', desc: 'Basado en la descripción.' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setProductImage(URL.createObjectURL(e.target.files[0]));
      }
  };

  const handleGenerate = async () => {
    if(!productName || !productImage) return;

    setIsGenerating(true);
    setSegments([]); // Clear previous
    
    try {
        // Llamada al nuevo servicio generador de guiones
        const results = await generateViralVideoScript(
            productName,
            price,
            description,
            videoStrategy,
            productImage
        );

        // Generar prompt musical basado en el estilo del video
        let audioGenre = 'Trending Phonk';
        if (videoStrategy === 'Cinematic 3D') audioGenre = 'Cinematic Epic';
        if (videoStrategy === 'Cinematic Lifestyle') audioGenre = 'Elegant Electronic Pop, Chill';
        if (videoStrategy === 'Exclusividad') audioGenre = 'Cinematic Luxury';

        const audio = await generateSunoPrompt(productName, audioGenre);
        
        setSegments(results);
        setSunoPrompt(audio);
    } catch (error) {
        console.error("Error generando guion", error);
        alert("Hubo un error generando el guion. Intenta de nuevo.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateSceneImage = async (segmentId: number) => {
      if (!productImage) {
          alert("Necesitas subir una imagen de producto primero.");
          return;
      }
      const segment = segments.find(s => s.id === segmentId);
      if (!segment) return;

      setGeneratingImages(prev => ({ ...prev, [segmentId]: true }));
      try {
          // Usamos la imagen del producto como base y el prompt específico de la imagen de la escena
          const newImageUrl = await regenerateSlideImage(productImage, segment.imagePrompt);
          
          setSegments(prev => prev.map(s => 
              s.id === segmentId ? { ...s, imageUrl: newImageUrl } : s
          ));
      } catch (error) {
          console.error("Error generating scene image", error);
      } finally {
          setGeneratingImages(prev => ({ ...prev, [segmentId]: false }));
      }
  };

  const handleSaveToDB = () => {
      if(segments.length === 0) return;
      const video: SavedVideoProject = {
          id: Date.now().toString(),
          productName,
          segments,
          sunoPrompt,
          createdAt: new Date()
      };
      saveVideoProject(video);
      alert('Proyecto de video guardado en sesión.');
  };

  const handleDownload = () => {
      if(segments.length === 0) return;
      const data = {
          producto: productName,
          precio: price,
          estrategia: videoStrategy,
          musica: sunoPrompt,
          segmentos: segments.map(s => ({ 
              tiempo: s.timeRange, 
              narracion: s.visualDescription, 
              camara: s.cameraMovement, 
              iluminacion: s.lighting, 
              prompt_generacion_video: s.grokPrompt 
          }))
      };
      downloadJSON(data, `Guion_Viral_${productName.replace(/\s+/g, '_')}.json`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Arquitecto de Video Viral</h2>
                <p className="text-slate-500">Transforma tu producto en un guion estructurado para TikTok/Reels (9:16) con efectos visuales.</p>
            </div>
            {segments.length > 0 && (
                 <div className="flex gap-2">
                    <button onClick={handleSaveToDB} className="text-sm bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-100 font-medium">
                        <Save size={16} /> Guardar
                    </button>
                    <button onClick={handleDownload} className="text-sm bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 font-medium">
                        <Download size={16} /> Descargar Guion
                    </button>
                </div>
            )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Input Section (Left Column) */}
            <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Video size={18} className="text-orange-500" /> Configuración del Video
                    </h3>

                    <div className="space-y-4">
                        {/* 1. Imagen del Producto */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">1. Imagen del Producto (Referencia Visual)</label>
                            <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 cursor-pointer group transition-colors min-h-[140px] flex flex-col items-center justify-center">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    onChange={handleImageUpload}
                                />
                                {productImage ? (
                                    <div className="relative w-full h-32">
                                        <img src={productImage} alt="Preview" className="w-full h-full object-contain rounded" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                            <span className="text-white text-xs font-bold">Cambiar imagen</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400 group-hover:text-orange-500">
                                        <Upload size={24} className="mb-2" />
                                        <span className="text-sm font-medium">Sube foto del producto</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Datos Básicos */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Producto</label>
                                <input 
                                    type="text" 
                                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Ej: SmartWatch X"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                />
                            </div>
                             <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Precio (S/.)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 pl-7 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="199.99"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                    <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs font-bold mt-0.5">S/.</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Descripción */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                <AlignLeft size={10} /> Descripción / Detalles
                            </label>
                            <textarea 
                                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none h-20"
                                placeholder="Características clave, beneficios..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* 4. Estrategia */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                                <LayoutTemplate size={10} /> Tipo de Video (Estrategia)
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {strategies.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setVideoStrategy(s.id)}
                                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                                            videoStrategy === s.id 
                                            ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                                        }`}
                                    >
                                        <div className="font-bold">{s.label}</div>
                                        <div className="text-[10px] opacity-80">{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !productName || !productImage}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                isGenerating || !productName || !productImage
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-orange-500/20'
                            }`}
                        >
                            {isGenerating ? (
                                <><Loader2 className="animate-spin" size={18}/> Diseñando Guion...</>
                            ) : (
                                <><Wand2 size={18} /> Generar Guion Viral</>
                            )}
                        </button>
                    </div>
                </div>

                {sunoPrompt && (
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg">
                         <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Music size={18} /> Melodía Sugerida
                        </h3>
                        <p className="text-sm opacity-90 font-mono bg-black/20 p-3 rounded-lg border border-white/10">
                            {sunoPrompt}
                        </p>
                    </div>
                )}
            </div>

            {/* Output Section (Right Column) */}
            <div className="lg:col-span-8 space-y-6">
                {segments.length === 0 && !isGenerating && (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <Film size={64} className="mb-4 opacity-30" />
                        <h3 className="text-lg font-bold text-slate-500">Tu guion aparecerá aquí</h3>
                        <p className="text-sm max-w-xs text-center mt-2">Sube una foto y configura la estrategia. Obtendrás un guion de 30s+ con prompts detallados segundo a segundo.</p>
                    </div>
                )}

                {isGenerating && (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-slate-800 font-bold text-lg">Diseñando estructura viral...</p>
                        <p className="text-sm text-slate-500 mt-2">Calculando tiempos (Min 30s) y Efectos Visuales...</p>
                        <div className="mt-4 flex gap-2 text-xs text-slate-400">
                             <span className="bg-slate-100 px-2 py-1 rounded">Micro-Timing</span>
                             <span className="bg-slate-100 px-2 py-1 rounded">VFX Prompts</span>
                             <span className="bg-slate-100 px-2 py-1 rounded">Retención</span>
                        </div>
                    </div>
                )}

                {segments.map((segment) => (
                    <div key={segment.id} className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 group hover:border-orange-200 transition-colors" style={{ animationDelay: `${segment.id * 100}ms` }}>
                        
                        {/* LEFT COLUMN: Visual Reference Generator */}
                        <div className="w-full md:w-64 bg-slate-50 flex-shrink-0 relative border-r border-slate-100 flex flex-col">
                             <div className="relative aspect-[9/16] w-full bg-slate-200 overflow-hidden group/image">
                                 {/* Image: Generated vs Reference */}
                                 {segment.imageUrl ? (
                                     <img src={segment.imageUrl} alt="Scene Gen" className="w-full h-full object-cover" />
                                 ) : productImage ? (
                                    <div className="w-full h-full relative">
                                        <img src={productImage} alt="Ref Base" className="w-full h-full object-cover opacity-50 blur-[3px]" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ImageIcon className="text-slate-500" size={32} />
                                        </div>
                                    </div>
                                 ) : null}
                                 
                                 {/* Time Badge */}
                                 <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-sm z-10">
                                    {segment.timeRange}
                                 </div>

                                 {/* Loading State */}
                                 {generatingImages[segment.id] && (
                                     <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20">
                                         <Loader2 className="animate-spin text-orange-500 mb-2" size={24} />
                                         <span className="text-[10px] font-bold text-slate-500">Generando...</span>
                                     </div>
                                 )}

                                 {/* Generate Button Overlay */}
                                 <div className={`absolute bottom-4 left-0 right-0 flex justify-center z-10 ${segment.imageUrl ? 'opacity-0 group-hover/image:opacity-100 transition-opacity' : ''}`}>
                                     <button 
                                        onClick={() => handleGenerateSceneImage(segment.id)}
                                        disabled={generatingImages[segment.id]}
                                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg flex items-center gap-1 transition-all transform hover:scale-105"
                                     >
                                         <Wand2 size={12} />
                                         {segment.imageUrl ? 'Regenerar Imagen' : 'Generar Imagen'}
                                     </button>
                                 </div>
                             </div>

                             {/* Static Image Prompt Area */}
                             <div className="p-3 bg-white border-t border-slate-100 flex-1 flex flex-col">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <ImageIcon size={10} /> Prompt Imagen (FOTO)
                                    </span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(segment.imagePrompt)}
                                        className="text-slate-400 hover:text-orange-500"
                                    >
                                        <Copy size={10} />
                                    </button>
                                 </div>
                                 <p className="text-xs text-slate-600 leading-tight font-mono bg-slate-50 p-2 rounded border border-slate-100 max-h-20 overflow-y-auto">
                                     {segment.imagePrompt}
                                 </p>
                             </div>
                        </div>

                        {/* RIGHT COLUMN: Details & Video Prompt */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acción & Narrativa</span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-50 px-2 py-1 rounded">
                                        <Clock size={12} /> 6 seg
                                    </div>
                                </div>
                                <p className="text-slate-800 font-medium text-sm leading-relaxed border-l-2 border-orange-200 pl-3 mb-4">
                                    {segment.visualDescription}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Cámara (9:16)</span>
                                        <p className="text-xs text-slate-700 font-medium">{segment.cameraMovement}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                         <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Iluminación</span>
                                         <p className="text-xs text-slate-700 font-medium">{segment.lighting}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 relative group/prompt">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-orange-400 uppercase flex items-center gap-1">
                                        <Film size={10} /> Prompt Video (Para AI Video)
                                    </span>
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(segment.grokPrompt); alert("Prompt copiado");}}
                                        className="text-[10px] text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>
                                <p className="text-xs font-mono text-slate-400 break-words leading-relaxed selection:bg-orange-500 selection:text-white">
                                    {segment.grokPrompt}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default VideoArchitect;