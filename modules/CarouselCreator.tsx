import React, { useState } from 'react';
import { Sparkles, MessageSquare, Music, Lightbulb, Save, Download, Upload, ArrowRight, Wand2, Loader2, Check, Copy, Image as ImageIcon, RefreshCw, Type, MousePointerClick, Edit3, Palette } from 'lucide-react';
import { CarouselSlide, SavedCarousel } from '../types';
import { generateCarousel, regenerateSlideImage, generateSunoPrompt, generateEducationalIdeas, generateCarouselSocialCopy } from '../services/mockAiService';
import { saveCarousel, downloadJSON } from '../services/persistence';

const CarouselCreator: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [eduFocus, setEduFocus] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [musicGenre, setMusicGenre] = useState('Modern Phonk');
  
  // Data State
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [socialCopy, setSocialCopy] = useState('');
  const [sunoPrompt, setSunoPrompt] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingMusic, setIsRegeneratingMusic] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  
  // AI Refinement State
  const [refinementPrompts, setRefinementPrompts] = useState<Record<number, string>>({});
  const [slideTextColors, setSlideTextColors] = useState<Record<number, 'white' | 'black'>>({});
  
  // Ideas Generation
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [hasSelectedIdea, setHasSelectedIdea] = useState(false);

  const GENRES = ["Modern Phonk", "Lo-Fi Chill", "Cinematic Epic", "Corporate Upbeat", "Pop Energetic", "Minimal Tech"];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const toggleTextColor = (slideId: number) => {
      setSlideTextColors(prev => ({
          ...prev,
          [slideId]: prev[slideId] === 'black' ? 'white' : 'black'
      }));
  };

  const handleAutogenerateIdeas = async () => {
      if (!productName) {
          alert("Por favor ingresa primero el nombre del producto.");
          return;
      }
      setIsGeneratingIdeas(true);
      setGeneratedIdeas([]);
      setHasSelectedIdea(false); // Reset selection
      setEduFocus(''); // Clear current
      
      const ideas = await generateEducationalIdeas(productName, features);
      setGeneratedIdeas(ideas);
      setIsGeneratingIdeas(false);
  };

  const selectIdea = (idea: string) => {
      setEduFocus(idea);
      setHasSelectedIdea(true);
  };

  const handleCreateStrategy = async () => {
    if (!productName) return;
    setIsLoading(true);
    setSlides([]);
    setSocialCopy('');
    setSunoPrompt('');
    setRefinementPrompts({});
    setSlideTextColors({}); // Reset colors

    const fullContext = `${productName}. Características: ${features}. Foco Educativo: ${eduFocus}`;
    
    // 1. Generate Structure & Prompts (Text Only)
    const generatedSlides = await generateCarousel(fullContext, productImage || undefined);
    
    // Set default text colors to white
    const initialColors: Record<number, 'white' | 'black'> = {};
    generatedSlides.forEach(s => initialColors[s.id] = 'white');
    setSlideTextColors(initialColors);

    setSlides(generatedSlides);
    
    // 2. Generate Social Copy
    const copy = await generateCarouselSocialCopy(productName);
    setSocialCopy(copy);

    // 3. Generate Music Prompt with selected Genre
    const music = await generateSunoPrompt(productName, musicGenre);
    setSunoPrompt(music);

    setIsLoading(false);
  };

  const handleGenerateSlideImage = async (slide: CarouselSlide) => {
      // Toggle loading for specific slide
      setGeneratingImages(prev => ({ ...prev, [slide.id]: true }));

      try {
          let sourceImage: string | null = null;
          if (slide.type === 'hook') {
              sourceImage = null; 
          } else {
              sourceImage = productImage || null;
          }

          const refinement = refinementPrompts[slide.id] || "";
          const newImageUrl = await regenerateSlideImage(sourceImage, slide.imagePrompt, refinement);

          setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, imageUrl: newImageUrl } : s));
          
      } catch (error) {
          console.error("Error generating image", error);
      } finally {
          setGeneratingImages(prev => ({ ...prev, [slide.id]: false }));
      }
  };

  const handleRegenerateMusic = async () => {
      if(!productName) return;
      setIsRegeneratingMusic(true);
      const music = await generateSunoPrompt(productName, musicGenre);
      setSunoPrompt(music);
      setIsRegeneratingMusic(false);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Texto copiado al portapapeles");
  };

  const handleSaveToDB = () => {
      if(slides.length === 0) return;
      const carousel: SavedCarousel = {
          id: Date.now().toString(),
          topic: productName,
          slides,
          sunoPrompt: sunoPrompt,
          createdAt: new Date()
      };
      saveCarousel(carousel);
      alert('Carrusel guardado.');
  };

  // Determine if the main button should be enabled
  const isReadyToGenerate = productName && eduFocus && (!generatedIdeas.length || hasSelectedIdea);

  return (
    <div className="p-8 max-w-full mx-auto flex flex-col gap-8">
       <header className="flex-shrink-0">
          <h2 className="text-3xl font-bold text-slate-900">Creador de Carruseles (Seiso Master)</h2>
          <p className="text-slate-500">Genera contenido experto: Gancho, Solución, Educación y Venta.</p>
      </header>

      {/* SECTION 1: FULL WIDTH INPUT PANEL */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  Datos del Producto
              </h3>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Paso 1: Configuración</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Column 1: Image Upload */}
              <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Foto Referencia</label>
                  <div className="h-full min-h-[200px] border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer relative group bg-slate-50">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                        onChange={handleImageUpload} 
                      />
                      {productImage ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                              <img src={productImage} alt="Preview" className="max-h-48 object-contain rounded-lg shadow-sm" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-lg pointer-events-none">
                                  Cambiar Imagen
                              </div>
                          </div>
                      ) : (
                          <>
                            <Upload size={32} className="mb-2" />
                            <span className="text-xs text-center font-medium">Sube tu foto aquí</span>
                          </>
                      )}
                  </div>
              </div>

              {/* Column 2: Data Inputs */}
              <div className="lg:col-span-9 flex flex-col justify-between gap-6">
                  
                  {/* Name Input */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Producto</label>
                      <input 
                        type="text" 
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Ej. Kit de limpieza para zapatillas blancas"
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                      />
                  </div>

                   {/* Features Input */}
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Características Clave</label>
                      <textarea 
                        value={features}
                        onChange={(e) => setFeatures(e.target.value)}
                        placeholder="Ej. Cepillo suave, solución biodegradable, paño microfibra..."
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none shadow-sm"
                      />
                  </div>

                   {/* Educational Focus Input */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Foco Educativo (Estrategia)</label>
                          <button 
                            onClick={handleAutogenerateIdeas}
                            disabled={isGeneratingIdeas || !productName}
                            className={`text-[10px] font-bold flex items-center gap-1 hover:underline transition-colors ${!productName ? 'text-slate-300 cursor-not-allowed' : 'text-orange-600'}`}
                          >
                             {isGeneratingIdeas ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />} 
                             Autogenerar Ideas
                          </button>
                      </div>
                      <div className="relative">
                        <textarea 
                            value={eduFocus}
                            onChange={(e) => {
                                setEduFocus(e.target.value);
                                if(generatedIdeas.length === 0) setHasSelectedIdea(true); 
                            }}
                            placeholder={generatedIdeas.length > 0 ? "Selecciona una opción abajo para rellenar este campo 👇" : "Ej. 3 usos poco conocidos de la solución de limpieza..."}
                            className={`w-full border rounded-lg px-4 py-3 text-base font-medium focus:ring-2 outline-none shadow-sm transition-all h-24 resize-none ${generatedIdeas.length > 0 && !hasSelectedIdea ? 'border-orange-300 ring-2 ring-orange-100 bg-orange-50/30 placeholder-orange-400' : 'border-slate-300 focus:ring-orange-500'}`}
                        />
                        
                        {/* Generated Ideas Selection */}
                        {generatedIdeas.length > 0 && (
                            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                                        <MousePointerClick size={12}/> Haz clic para usar una idea:
                                    </p>
                                    {!hasSelectedIdea && (
                                        <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">Selección Requerida</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {generatedIdeas.map((idea, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => selectIdea(idea)}
                                            className={`w-full text-left p-4 rounded-lg text-xs leading-snug transition-all border relative h-full flex items-start ${
                                                eduFocus === idea 
                                                ? 'bg-orange-500 text-white border-orange-600 shadow-md transform scale-[1.02]' 
                                                : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                                            }`}
                                        >
                                            {idea}
                                            {eduFocus === idea && <Check size={16} className="absolute right-2 bottom-2" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                      </div>
                  </div>

                  {/* Music Genre Selection */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vibe Musical (Prompt IA)</label>
                      <select 
                        value={musicGenre}
                        onChange={(e) => setMusicGenre(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
                      >
                          {GENRES.map(g => (
                              <option key={g} value={g}>{g}</option>
                          ))}
                      </select>
                  </div>

                  {/* Action Button */}
                  <div className="mt-2">
                      <button 
                        onClick={handleCreateStrategy}
                        disabled={isLoading || !isReadyToGenerate}
                        className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg ${
                            isLoading || !isReadyToGenerate 
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70' 
                            : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01]'
                        }`}
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={24} />} 
                        {isLoading ? 'Diseñando Estrategia...' : 'Generar Estrategia Maestra (Seiso V1.0)'}
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* SECTION 2: RESULTS */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 min-h-[400px]">
          
          {slides.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <ArrowRight size={24} className="text-slate-300" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-600">Esperando datos...</h3>
                  <p className="text-sm">Completa el formulario arriba para ver los resultados.</p>
              </div>
          )}

          {isLoading && (
               <div className="flex flex-col items-center justify-center h-64">
                   <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                   <p className="text-slate-600 font-bold animate-pulse">El Profesor está analizando el producto...</p>
               </div>
          )}

          {slides.length > 0 && (
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Estrategia Generada</h3>
                    <p className="text-sm text-slate-500">5 Slides: Gancho, Solución, Edu Téc, Edu Res, CTA.</p>
                </div>
                <button onClick={handleSaveToDB} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-orange-500 transition-colors shadow-sm">
                    <Save size={18} /> Guardar
                </button>
              </div>
          )}

          {/* SLIDES GRID - LARGE VIEW (2 Columns) */}
          {slides.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-8">
                  {slides.map((slide, index) => (
                      <div 
                        key={slide.id} 
                        className={`bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col hover:shadow-xl transition-all duration-300 ${index === 4 ? 'lg:col-span-2 lg:w-1/2 lg:mx-auto' : ''}`}
                      >
                          
                          {/* Card Header */}
                          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    SLIDE {slide.id}: {slide.type.toUpperCase()}
                                </span>
                                <h4 className="font-bold text-slate-800 text-lg leading-tight">{slide.title}</h4>
                              </div>
                              <button 
                                onClick={() => toggleTextColor(slide.id)}
                                className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors border border-slate-200"
                                title="Cambiar color del texto (Blanco/Negro)"
                              >
                                  <Palette size={12} />
                                  {slideTextColors[slide.id] === 'white' ? 'Texto Blanco' : 'Texto Negro'}
                              </button>
                          </div>

                          {/* Image Area - LARGE with TEXT OVERLAY */}
                          <div className="relative aspect-[4/5] bg-slate-100 border-b border-slate-100 group overflow-hidden">
                              {/* The Image */}
                              {slide.imageUrl ? (
                                  <img src={slide.imageUrl} alt="Slide" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                      <ImageIcon size={64} className="mb-4 opacity-50" />
                                      <span className="text-sm font-medium">Sin imagen generada</span>
                                  </div>
                              )}
                              
                              {/* THE OVERLAY TEXT (CENTERED, NO BOX) */}
                              <div className="absolute inset-0 p-8 flex items-center justify-center pointer-events-none">
                                <p 
                                    className={`font-black text-2xl md:text-3xl leading-tight text-center drop-shadow-md transition-colors duration-300 ${
                                        slideTextColors[slide.id] === 'black' 
                                            ? 'text-black [text-shadow:0_2px_10px_rgba(255,255,255,0.8)]' 
                                            : 'text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]'
                                    }`}
                                >
                                    {slide.overlayText}
                                </p>
                              </div>

                              {/* Loading Overlay */}
                              {generatingImages[slide.id] && (
                                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
                                      <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
                                      <span className="text-sm font-bold text-slate-500">Creando Imagen HD...</span>
                                  </div>
                              )}

                              {/* Generate Button Overlay */}
                              <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 pointer-events-auto">
                                  <button 
                                    onClick={() => handleGenerateSlideImage(slide)}
                                    className="bg-orange-500 text-white text-sm font-bold px-6 py-3 rounded-full shadow-xl flex items-center gap-2 hover:bg-orange-600 transition-colors transform hover:scale-105"
                                  >
                                      {slide.imageUrl ? <RefreshCw size={16} /> : <Wand2 size={16} />}
                                      {slide.imageUrl ? (refinementPrompts[slide.id] ? 'Regenerar con Ajuste' : 'Regenerar') : 'Generar Imagen'}
                                  </button>
                              </div>
                          </div>

                          {/* AI Director Input (Below Image) */}
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="bg-orange-100 text-orange-600 p-1 rounded">
                                      <Edit3 size={12} />
                                  </div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">🎨 Director de Arte IA</label>
                              </div>
                              <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Ej. Haz el producto más grande, fondo azul..."
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:ring-1 focus:ring-orange-500 outline-none bg-white"
                                    value={refinementPrompts[slide.id] || ''}
                                    onChange={(e) => setRefinementPrompts(prev => ({ ...prev, [slide.id]: e.target.value }))}
                                />
                                {refinementPrompts[slide.id] && (
                                    <div className="absolute right-2 top-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Cambios pendientes"></div>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 pl-1">
                                  * Escribe aquí tus cambios y pulsa "Regenerar" en la imagen.
                              </p>
                          </div>

                          {/* Content Area */}
                          <div className="p-6 space-y-6 flex-1 flex flex-col">
                              
                              {/* Overlay Text Input (Editable) */}
                              <div className="flex-1">
                                  <label className="text-[10px] font-bold text-orange-600 flex items-center gap-1 mb-2 uppercase bg-orange-50 w-fit px-2 py-0.5 rounded">
                                      <Type size={12} /> Texto Sugerido (Visible en Imagen)
                                  </label>
                                  <textarea 
                                    className="w-full text-base font-bold text-slate-800 border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-orange-500 outline-none resize-none h-24 bg-slate-50"
                                    defaultValue={slide.overlayText}
                                  />
                              </div>

                              {/* Prompt Box - Displaying the generated Spanish prompt */}
                              <div className="bg-slate-900 rounded-lg p-4 relative group mt-auto">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">PROMPT PARA IMAGEN (ESPAÑOL)</span>
                                      <button 
                                        onClick={() => copyToClipboard(slide.imagePrompt)}
                                        className="text-slate-500 hover:text-white transition-colors"
                                      >
                                          <Copy size={14} />
                                      </button>
                                  </div>
                                  <p className="text-xs font-mono text-slate-400 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-help">
                                      {slide.imagePrompt}
                                  </p>
                              </div>

                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* Social Copy Section */}
          {socialCopy && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mt-8 max-w-4xl mx-auto">
                  <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare size={20} className="text-orange-500" /> Copy para Redes Sociales (Estilo Mentor)
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 relative group">
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{socialCopy}</pre>
                      <button 
                        onClick={() => copyToClipboard(socialCopy)}
                        className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:text-orange-500 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copiar texto"
                      >
                          <Copy size={16} />
                      </button>
                  </div>
              </div>
          )}

          {/* BACKGROUND MELODY SECTION */}
          {sunoPrompt && (
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700 shadow-lg mt-8 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-white flex items-center gap-2">
                          <Music size={20} className="text-orange-500" /> Melodía de Fondo (Suno AI)
                      </h4>
                      <button 
                          onClick={handleRegenerateMusic}
                          disabled={isRegeneratingMusic}
                          className="text-xs font-bold flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                          {isRegeneratingMusic ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          Refrescar
                      </button>
                  </div>
                  <div className="bg-black/30 rounded-xl p-6 border border-white/10 relative group">
                      <p className="text-sm text-orange-100 font-mono leading-relaxed">{sunoPrompt}</p>
                      <button 
                        onClick={() => copyToClipboard(sunoPrompt)}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Copiar Prompt Musical"
                      >
                          <Copy size={16} />
                      </button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default CarouselCreator;