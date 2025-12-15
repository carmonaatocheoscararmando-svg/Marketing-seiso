import React, { useState } from 'react';
import { Upload, Download, Sparkles, Eraser, Layers, Check, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { enhanceImageQuality, removeImageBackground, cleanupImageText } from '../services/mockAiService';
import { downloadJSON } from '../services/persistence';

const PhotoStudio: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setOriginalImage(url);
      setProcessedImage(null); // Reset processing on new upload
      setActiveAction(null);
    }
  };

  const processImage = async (action: 'upscale' | 'bg-remove' | 'text-cleanup') => {
    if (!originalImage) return;
    setIsProcessing(true);
    setActiveAction(action);
    setProcessedImage(null);

    let result = '';
    
    // Simulate API calls
    if (action === 'upscale') {
        result = await enhanceImageQuality(originalImage);
    } else if (action === 'bg-remove') {
        result = await removeImageBackground(originalImage);
    } else if (action === 'text-cleanup') {
        result = await cleanupImageText(originalImage);
    }

    setProcessedImage(result);
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `Seiso_Studio_${activeAction}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="text-orange-500" /> Magic Studio
        </h2>
        <p className="text-slate-500">Mejora, limpia y perfecciona tus fotos de producto con IA para usarlas en tus Ads.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        
        {/* LEFT PANEL: TOOLS */}
        <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4">1. Sube tu Producto</h3>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-colors cursor-pointer relative group bg-slate-50 mb-6">
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                <Upload size={32} className="mb-2" />
                <span className="text-sm font-medium">Click para subir foto</span>
            </div>

            {originalImage && (
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-4">2. Elige una Acción</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={() => processImage('upscale')}
                            disabled={isProcessing}
                            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${activeAction === 'upscale' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:border-orange-300'}`}
                        >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm">Mejorar Nitidez (4K)</h4>
                                <p className="text-xs text-slate-400">Upscaling IA + Corrección de color</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => processImage('bg-remove')}
                            disabled={isProcessing}
                            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${activeAction === 'bg-remove' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:border-orange-300'}`}
                        >
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                <Layers size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm">Quitar Fondo</h4>
                                <p className="text-xs text-slate-400">Fondo transparente (PNG)</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => processImage('text-cleanup')}
                            disabled={isProcessing}
                            className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${activeAction === 'text-cleanup' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:border-orange-300'}`}
                        >
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                <Eraser size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm">Limpiar Texto</h4>
                                <p className="text-xs text-slate-400">Elimina marcas de agua o etiquetas</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT PANEL: VIEWER */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
             
             {!originalImage && (
                 <div className="text-center text-slate-500">
                     <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                     <p>Sube una imagen para comenzar la edición</p>
                 </div>
             )}

             {originalImage && (
                 <div className="w-full h-full flex flex-col gap-4">
                     {/* Comparison Area */}
                     <div className="flex-1 flex gap-4 min-h-0">
                         {/* Original */}
                         <div className="flex-1 flex flex-col gap-2 relative group">
                             <div className="bg-white/5 rounded-t-lg py-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wide">Original</div>
                             <div className="flex-1 bg-black/40 rounded-lg overflow-hidden relative border border-slate-700">
                                 <img src={originalImage} className="w-full h-full object-contain" alt="Original" />
                             </div>
                         </div>

                         {/* Arrow */}
                         <div className="flex items-center justify-center text-slate-600">
                            <ArrowRight />
                         </div>

                         {/* Result */}
                         <div className="flex-1 flex flex-col gap-2 relative">
                             <div className="bg-white/5 rounded-t-lg py-2 px-4 text-xs font-bold text-orange-400 uppercase tracking-wide flex justify-between">
                                 <span>Resultado</span>
                                 {processedImage && <Check size={14} />}
                             </div>
                             <div className="flex-1 bg-black/40 rounded-lg overflow-hidden relative border border-orange-500/30">
                                 {isProcessing ? (
                                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
                                         <Sparkles className="animate-spin text-orange-500 mb-2" size={32} />
                                         <p className="text-xs text-orange-400 font-mono animate-pulse">Procesando Pixeles...</p>
                                     </div>
                                 ) : processedImage ? (
                                    <>
                                     <img src={processedImage} className={`w-full h-full object-contain ${activeAction === 'bg-remove' ? 'bg-[url(https://media.istockphoto.com/id/1222357475/vector/transparent-background-checker-pattern.jpg?s=612x612&w=0&k=20&c=N--MvjV2w9L1P0aJdE8P4Bq2Q6F_6Z6F9_5F5F5F5.jpg)]' : ''}`} alt="Processed" />
                                     <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                                         LISTO
                                     </div>
                                    </>
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                         Esperando acción...
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>

                     {/* Download Bar */}
                     {processedImage && (
                        <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between animate-fade-in-up">
                            <div>
                                <p className="text-white text-sm font-bold">Edición completada</p>
                                <p className="text-slate-400 text-xs">Tu imagen está lista para ser usada en el Generador de Ads.</p>
                            </div>
                            <button 
                                onClick={handleDownload}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                            >
                                <Download size={18} /> Descargar Imagen
                            </button>
                        </div>
                     )}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default PhotoStudio;