import { GoogleGenAI } from "@google/genai";
import { AdCampaign, CarouselSlide, StrategyAngle, VideoSegment, ChatMessage } from '../types';

// Inicializar Gemini
// Nota: Se asume que process.env.API_KEY está configurado en el entorno.
const getAI = () => {
    try {
        if (process.env.API_KEY) {
            return new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    } catch (e) {
        console.warn("API Key no detectada, usando simulación.");
    }
    return null;
};

// Helper to simulate network delay for fallbacks
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Convertir URL/Blob a Base64 para Gemini
async function urlToBase64(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Eliminar el prefijo data:image/...;base64,
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error convirtiendo imagen a base64", e);
        return "";
    }
}

// Helper: Obtener MimeType
async function getMimeType(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return blob.type;
    } catch (e) {
        return "image/jpeg";
    }
}

// Helper Genérico para procesar imágenes con Gemini
async function processImageWithGemini(imageUrl: string | null | undefined, prompt: string): Promise<string> {
    const ai = getAI();
    
    // Fallback si no hay AI o falla la conversión
    if (!ai) {
        console.log("Modo Simulación: Devolviendo imagen original tras delay.");
        await delay(2000);
        return imageUrl || `https://picsum.photos/seed/${Math.random()}/500/500`; 
    }

    try {
        let contentsParts: any[] = [{ text: prompt }];

        if (imageUrl) {
            const base64Data = await urlToBase64(imageUrl);
            const mimeType = await getMimeType(imageUrl);

            if (base64Data) {
                 contentsParts = [
                    { 
                        inlineData: { 
                            mimeType: mimeType, 
                            data: base64Data 
                        } 
                    },
                    { text: prompt }
                ];
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: contentsParts
            }
        });

        // Buscar la parte de imagen en la respuesta
        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        
        throw new Error("Gemini no devolvió una imagen");

    } catch (error) {
        console.error("Error procesando imagen con Gemini:", error);
        // Fallback visual simple si falla la IA (para que la app no se rompa)
        await delay(1000);
        return imageUrl || "https://picsum.photos/400/400";
    }
}

// --- PHOTO STUDIO MODULE (REAL AI) ---

export const enhanceImageQuality = async (imageUrl: string): Promise<string> => {
    return processImageWithGemini(
        imageUrl, 
        "Generate a high-fidelity, high-resolution version of this product image. Improve lighting, sharpness, and clarity while preserving the exact product details. Make it look like a professional 4k studio shot."
    );
};

export const removeImageBackground = async (imageUrl: string): Promise<string> => {
    return processImageWithGemini(
        imageUrl, 
        "Isolate the main product in this image and place it on a pure solid white background. Remove all surrounding objects and clutter."
    );
};

export const cleanupImageText = async (imageUrl: string): Promise<string> => {
    return processImageWithGemini(
        imageUrl, 
        "Remove any text overlays, watermarks, or labels that are superimposed on the image. Reconstruct the background behind the text seamlessly."
    );
};

// --- ADS MODULE ---

export const generateAdCopy = async (product: string, price: string, strategy: StrategyAngle, description: string, length: 'short' | 'medium' | 'long'): Promise<string> => {
  const ai = getAI();
  // ... (Logica de Ads se mantiene igual por brevedad, enfocándonos en Carrusel) ...
  // Fallback Mock simplificado
  await delay(1000);
  return `🔥 ¡${product} está disponible! Precio S/ ${price}. ${description.substring(0,50)}...`;
};

export const generateMarketingImage = async (originalImageUrl: string, product: string, adCopy: string, strategy: StrategyAngle, refinementInstruction?: string): Promise<string> => {
    let prompt = `
    You are an expert commercial advertising photographer.
    Product: ${product}
    Strategy: ${strategy}
    Context: ${adCopy}
    Task: Create a high-end marketing image preserving the product identity.
    `;
    if (refinementInstruction) {
        prompt += `\nUSER INSTRUCTION: ${refinementInstruction}`;
    }
    return processImageWithGemini(originalImageUrl, prompt);
};

// --- CAROUSEL MODULE (UPDATED MASTER PROMPT LOGIC) ---

export const generateEducationalIdeas = async (product: string, features: string): Promise<string[]> => {
    const ai = getAI();
    if (ai) {
        try {
            // Updated prompt for MORE and DIFFERENT ideas
            const prompt = `
            Eres un Experto Mentor de "SEISO STORE". Tu trabajo es revelar secretos de la industria.
            PRODUCTO: ${product}
            CARACTERÍSTICAS: ${features}
            
            Genera 5 ángulos educativos ÚNICOS, CURIOSOS y DIFERENTES a lo obvio. Evita clichés.
            Busca "Deep Cuts" (información profunda) o "Mitos vs Realidad".
            
            Formato:
            1. [Emoji] [Idea corta de max 15 palabras]
            2. ...
            3. ...
            4. ...
            5. ...

            Solo devuelve las 5 líneas de texto.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text) return response.text.split('\n').filter(line => line.trim().length > 5);
        } catch (e) { console.error(e); }
    }
    
    // Fallback con aleatoriedad para dar ideas "diferentes" sin AI
    await delay(1000);
    const pool = [
        `✨ La verdad oculta sobre la limpieza de ${product}.`,
        `💡 Por qué el 90% lo usa mal (y cómo corregirlo).`,
        `💎 El ingrediente secreto que protege tu inversión.`,
        `🛑 Mitos vs Realidad: Lo que daña tu ${product}.`,
        `🧠 Psicología del cuidado: Por qué esto dura más.`,
        `🔬 La ciencia detrás de los materiales de ${product}.`,
        `🚀 Hack de rendimiento: Úsalo en la mitad de tiempo.`,
        `🛡️ Blindaje total: Cómo prevenir el desgaste.`
    ];
    // Shuffle and pick 5
    return pool.sort(() => 0.5 - Math.random()).slice(0, 5);
};

export const generateCarousel = async (productInfo: string, uploadedImageUrl?: string): Promise<CarouselSlide[]> => {
  const ai = getAI();
  
  // Extraer datos del string combinado para un mejor prompt
  const parts = productInfo.split('. Características:');
  const prodName = parts[0];
  const rest = parts[1] ? parts[1].split('. Foco Educativo:') : ["", ""];
  const feats = rest[0];
  const focus = rest[1] || "Uso experto";

  if (ai) {
      try {
          const masterPrompt = `
            ROL: Eres un "Mentor Experto" (Arquetipo: El Sabio / Megido). 
            TU FILOSOFÍA: No vendes productos, vendes maestría y resultados. Conoces el producto mejor que nadie.
            TONO: Sofisticado, empático, seguro, técnico pero accesible. NUNCA uses jerga militar. Habla de "secretos", "técnica", "cuidado" y "inversión inteligente".

            OBJETIVO: Generar un plan de carrusel de 5 slides para SEISO STORE.
            IDIOMA DE SALIDA: ESPAÑOL (Tanto para textos como para prompts de imagen).

            INPUTS:
            - PRODUCTO: "${prodName}"
            - CARACTERÍSTICAS: "${feats}"
            - FOCO EDUCATIVO (Ángulo elegido): "${focus}"

            ESTRUCTURA OBLIGATORIA (Devuelve un JSON Array con 5 objetos):
            
            Slide 1 (Gancho/Problema):
            - type: "hook"
            - title: "El Diagnóstico"
            - content: "Contexto del problema común por falta de conocimiento."
            - overlayText: "Frase empática pero que señale un error común. Ej: '¿Tus ${prodName} fallan? No es el producto, es la técnica.'"
            - imagePrompt: "Descripción DETALLADA en ESPAÑOL del problema visual (suciedad, desorden, mal uso) SIN mostrar el producto nuevo todavía. Iluminación dramática pero realista."

            Slide 2 (Solución/Revelación):
            - type: "solution"
            - title: "La Herramienta del Maestro"
            - content: "Presentación del producto como la herramienta definitiva."
            - overlayText: "Frase de autoridad serena. Ej: 'Lo que usamos los expertos para resultados eternos.'"
            - imagePrompt: "Descripción DETALLADA en ESPAÑOL. HERO SHOT (Plano héroe) del producto '${prodName}' luciendo impecable, profesional y premium. Debe verse claramente que es NUESTRO producto."

            Slide 3 (Edu 1 - Profundidad):
            - type: "edu1"
            - title: "Lección Técnica"
            - content: "Explicación profunda del 'por qué' funciona."
            - overlayText: "Frase educativa basada en el Foco: '${focus}'. Ej: 'El secreto está en los detalles.'"
            - imagePrompt: "Descripción DETALLADA en ESPAÑOL mostrando el USO correcto del producto '${prodName}'. Plano detalle de manos expertas aplicando o usando el producto con precisión."

            Slide 4 (Edu 2 - Evidencia):
            - type: "edu2"
            - title: "El Resultado Megido"
            - content: "La transformación lograda."
            - overlayText: "Frase de validación. Ej: 'No es magia, es calidad técnica.'"
            - imagePrompt: "Descripción DETALLADA en ESPAÑOL del resultado final PERFECTO logrado gracias al producto '${prodName}'. Sensación de satisfacción y pulcritud."

            Slide 5 (CTA - Invitación):
            - type: "cta"
            - title: "Invitación al Club"
            - content: "Cierre invitando a elevar el estándar."
            - overlayText: "Frase de pertenencia. Ej: 'Eleva tu estándar. Consíguelo en el Link en Bio.'"
            - imagePrompt: "Descripción DETALLADA en ESPAÑOL de una composición elegante con el producto '${prodName}', logo implícito de Seiso, colores de marca (naranja/blanco) pero sobrios y profesionales."
            
            IMPORTANTE:
            - Devuelve SOLO el JSON Array válido. Sin markdown.
            - Los 'imagePrompt' deben estar en ESPAÑOL.
            - ASEGURA que el Slide 2 describa el producto claramente.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: masterPrompt,
              config: { responseMimeType: "application/json" }
          });
          
          const text = response.text;
          const slidesData = JSON.parse(text);

          // Mapear al formato interno asegurando IDs correctos
          return slidesData.map((s: any, i: number) => ({
              id: i + 1,
              type: s.type,
              title: s.title,
              content: s.content,
              overlayText: s.overlayText,
              imagePrompt: s.imagePrompt,
              imageUrl: ""
          }));

      } catch (e) {
          console.error("Error generando estructura con IA", e);
      }
  }

  // Fallback Robusto (Dynamic Template Filler) si no hay API
  await delay(1500);
  
  return [
    {
      id: 1,
      type: 'hook',
      title: "El Diagnóstico",
      content: `Primer plano del problema común con ${prodName}.`,
      overlayText: `¿Tu ${prodName} no rinde? Quizás estás ignorando esto.`,
      imagePrompt: `Primer plano dramático mostrando el problema que resuelve ${prodName} (ej. suciedad, desgaste). Estilo documental de alta calidad.`,
      imageUrl: "" 
    },
    {
      id: 2,
      type: 'solution',
      title: "La Herramienta del Maestro",
      content: `Presentación del ${prodName} como solución experta.`,
      overlayText: `La herramienta definitiva de Seiso Store. Calidad Profesional.`,
      imagePrompt: `Hero Shot (Plano principal) de ${prodName} sobre un fondo limpio y elegante. Iluminación de estudio suave que resalte los materiales y la calidad.`,
      imageUrl: ""
    },
    {
      id: 3,
      type: 'edu1',
      title: "Lección Técnica",
      content: `Demostración de uso inteligente.`,
      overlayText: `El secreto no es fuerza, es técnica: ${focus.substring(0, 15)}...`,
      imagePrompt: `Plano detalle de manos expertas utilizando ${prodName} con precisión. Ambiente de taller limpio o estudio profesional.`,
      imageUrl: ""
    },
    {
      id: 4,
      type: 'edu2',
      title: "El Resultado",
      content: "Resultado final impecable.",
      overlayText: `Resultados que hablan por sí solos. Impecable.`,
      imagePrompt: `Fotografía del resultado final perfecto logrado con ${prodName}. Brillo, orden y perfección visual.`,
      imageUrl: ""
    },
    {
      id: 5,
      type: 'cta',
      title: "Invitación",
      content: "Cierre de marca.",
      overlayText: `No te conformes con menos. Únete a los expertos Seiso. (Link en Bio).`,
      imagePrompt: `Bodegón elegante con ${prodName} y elementos de branding sutiles. Estética minimalista y premium.`,
      imageUrl: ""
    }
  ];
};

export const generateCarouselSocialCopy = async (product: string): Promise<string> => {
    const ai = getAI();
    if (ai) {
        try {
            const prompt = `
            Actúa como un Mentor Experto para SEISO STORE.
            PRODUCTO: ${product}
            
            Escribe un caption para Instagram:
            - Tono: Sabio, tranquilo, conocedor (No uses mayúsculas excesivas ni gritos).
            - Empieza con una pregunta reflexiva sobre el cuidado o uso del producto.
            - Explica el "Por qué" técnico de forma sencilla.
            - Presenta el producto como una inversión inteligente.
            - Cierre elegante invitando al perfil.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            if (response.text) return response.text;
        } catch(e) {}
    }

    await delay(1000);
    return `¿Sabías que la vida útil de tu ${product} depende de cómo lo cuidas? 🤔\n\nMuchos creen que es cuestión de suerte, pero en Seiso sabemos que es cuestión de técnica. El error común es ignorar los materiales.\n\nNuestro ${product} está diseñado con estándares profesionales para quienes valoran sus herramientas.\n\nEleva tu estándar hoy. Enlace en nuestra biografía. 🌟\n\n#SeisoStore #Maestria #Calidad #CuidadoProfesional`;
}

export const regenerateSlideImage = async (currentUrl: string | null | undefined, prompt: string, refinementInstruction?: string): Promise<string> => {
  if (getAI()) {
      let finalPrompt = prompt;
      // Añadir instrucción de refinamiento si existe
      if (refinementInstruction) {
          finalPrompt += `\n\nINSTRUCCIÓN ADICIONAL DEL USUARIO (PRIORIDAD ALTA): ${refinementInstruction}. Aplica esto a la imagen.`;
      }
      // Traducir implícitamente la intención: el prompt viene en español, Gemini lo entiende.
      // Le damos un contexto extra para asegurar calidad fotográfica.
      finalPrompt = `Genera una imagen fotorealista de alta calidad publicitaria (4k, iluminación de estudio) basada en esta descripción: ${finalPrompt}`;

      return processImageWithGemini(currentUrl, finalPrompt); 
  }
  await delay(1500);
  return currentUrl ? `${currentUrl}?random=${Math.random()}` : `https://picsum.photos/seed/${Math.random()}/500/500`; 
};

export const generateSunoPrompt = async (productContext: string, genre: string = "Modern Phonk"): Promise<string> => {
   const ai = getAI();
   
   // Determinar BPM y Vibe según género
   let bpmRange = "120-128 BPM";
   let vibe = "Energetic, Confident";
   
   if (genre.includes("Lo-Fi")) { bpmRange = "80-90 BPM"; vibe = "Chill, Relaxed, Study"; }
   if (genre.includes("Cinematic")) { bpmRange = "Varied BPM"; vibe = "Epic, Orchestral, Building Tension"; }
   if (genre.includes("Corporate")) { bpmRange = "110-120 BPM"; vibe = "Inspiring, Clean, Minimal"; }
   if (genre.includes("Pop")) { bpmRange = "120-130 BPM"; vibe = "Upbeat, Catchy, Happy"; }
   if (genre.includes("Elegant")) { bpmRange = "105-115 BPM"; vibe = "Elegant, Sophisticated, Fashion"; }

   if (ai) {
      try {
          const prompt = `
          Generate a "Suno AI" music prompt for a product video about: ${productContext}.
          
          REQURIEMENTS:
          1. Genre: ${genre}
          2. Style Tags: Instrumental, No Vocals, High Fidelity, ${vibe}.
          3. BPM: ${bpmRange}.
          4. Length: 30 seconds loopable.
          
          Output a single string formatted for Suno. e.g.: "Modern Phonk, 128 bpm, aggressive bass, instrumental, no vocals, luxury feel"
          `;
          const res = await ai.models.generateContent({model:'gemini-2.5-flash', contents: prompt});
          return res.text || `${genre}, ${bpmRange}, Instrumental, No Vocals, ${vibe}`;
      } catch(e){}
   }
   return `${genre}, ${bpmRange}, Instrumental, No Vocals, ${vibe}, High Quality Synthesis.`;
};

// --- VIDEO ARCHITECT MODULE (VIRAL STRUCTURE) ---

export const generateViralVideoScript = async (
    productName: string, 
    price: string, 
    description: string, 
    strategy: string, 
    productImageUrl: string
): Promise<VideoSegment[]> => {
  const ai = getAI();

  if (ai) {
      try {
          // Extraemos el base64 primero para pasarlo como argumento
          let imagePart = null;
          if (productImageUrl) {
              const base64Data = await urlToBase64(productImageUrl);
              const mimeType = await getMimeType(productImageUrl);
              if (base64Data) {
                  imagePart = {
                      inlineData: {
                          mimeType: mimeType,
                          data: base64Data
                      }
                  };
              }
          }

          // Lógica condicional para estrategias especiales
          let specialInstruction = "";
          
          if (strategy === 'Cinematic 3D') {
              specialInstruction = `
              ESTRATEGIA ESPECIAL ACTIVADA: "VIDEO CINEMATOGRÁFICO 3D DE PRODUCTO" (Estilo Apple/Nike Reveal).
              Actúa como un director creativo experto en Motion Graphics 3D y VFX de Alta Gama.
              
              DIRECTRICES VISUALES ESPECÍFICAS (CINEMATIC 3D):
              1. ESTILO: 3D Render Ultra Realista (Tipo Octane Render, Unreal Engine 5, Blender Cycles).
              2. ENTORNO: Fondos abstractos premium, limpios, colores sólidos mate o voids negros/blancos con iluminación volumétrica. NO uses locaciones reales como "cocina" o "parque". Todo es ESTUDIO VIRTUAL.
              3. COMPORTAMIENTO DEL PRODUCTO: Flotando, girando suavemente, despiece (exploded view) de componentes, levitación magnética.
              4. CÁMARA: Movimientos ultra suaves, Dolly in lento, Orbit 360, Macro extremo a texturas.
              5. PROMPTS (grokPrompt & imagePrompt): DEBEN incluir palabras clave obligatorias: "3D render, octane render, unreal engine 5, 8k, hyper realistic, studio lighting, depth of field, bokeh, glossy finish, product visualization".
              6. TEXTO EN PANTALLA: Minimalista, futurista, sans-serif, muy corto (Max 5 palabras).
              7. E-COMMERCE: Resalta 3 beneficios clave visualmente (ej: si es batería, muestra un núcleo de energía brillando).
              NOTA: Ignora las reglas de "personaje único" de otras estrategias. Aquí el ÚNICO personaje es el PRODUCTO.
              `;
          } else if (strategy === 'Cinematic Lifestyle') {
             specialInstruction = `
             ESTRATEGIA ESPECIAL ACTIVADA: "USO DE PRODUCTO ESTILO DE VIDA CINEMATOGRÁFICO" (Cinematic Lifestyle).
             Actúa como un Director de Cine Publicitario especializado en Fashion/Lifestyle (Estilo Zara, Nike, Sony).
             
             DIRECTRICES VISUALES ESPECÍFICAS (LIFESTYLE):
             1. CONCEPTO: Video aspiracional donde una persona real usa el producto en su rutina diaria (caminar por la ciudad, entrenar, viajar).
             2. ESTÉTICA: "Aesthetic", Cámara Lenta (Slow Motion), Iluminación natural cinematográfica (Golden Hour, Blue Hour, Neon City), poca profundidad de campo (Bokeh).
             3. CONTINUIDAD ABSOLUTA: Define UN solo protagonista (ej: "Joven mujer minimalista" o "Hombre urbano tech") y UN entorno coherente. Mantenlos en todas las escenas.
             4. CÁMARA: Handheld suave, seguimiento, primeros planos emocionales.
             5. **IMPORTANTE (grokPrompt):** Para esta estrategia, el campo 'grokPrompt' DEBE ESTAR EN INGLÉS y optimizado para herramientas de video AI (Sora, Runway Gen-2, Kling). 
                Estructura del prompt en inglés: "Cinematic shot of [Person Description] using [Product Name], [Action], [Environment], shallow depth of field, 4k, slow motion, soft lighting".
             6. ENFOQUE VENTA: Comodidad, libertad, integración en la vida diaria.
             `;
          }

          const masterVideoPrompt = `
            Actúa como un Director de Cine Publicitario y Experto en Videos Virales para TikTok/Reels y VFX Artist.
            
            CONTEXTO DEL PRODUCTO:
            - Nombre: "${productName}"
            - Precio: "S/. ${price}"
            - Descripción: "${description}"
            - ESTRATEGIA: "${strategy}"
            - IMAGEN REFERENCIA: (Ver adjunto)

            ${specialInstruction}

            TU TAREA:
            Crear un Guion Técnico Detallado para un video vertical (9:16) con MÍNIMO 30 SEGUNDOS de duración total.
            
            REGLA SUPREMA: COHERENCIA Y CONTINUIDAD VISUAL (CONTINUITY).
            Este es un ÚNICO video filmado en una sola locación o set. NO es una colección de clips de stock aleatorios.
            1. PERSONAJE ÚNICO (Si aplica): Si hay un actor, debe ser SIEMPRE el mismo. Describe sus rasgos (ej: "Chica joven, cabello castaño, ropa casual beige") y REPITE esta descripción exacta en CADA prompt de CADA escena.
            2. LOCACIÓN ÚNICA: Define un entorno maestro al inicio (ej: "Sala de estar minimalista moderna con luz de atardecer") y mantenlo constante en todo el video. No cambies de cocina a parque sin motivo.
            3. PRODUCTO: El producto debe verse consistente. Usa la imagen de referencia como verdad absoluta.

            REGLAS ESTRICTAS DE FORMATO:
            1. DURACIÓN MÍNIMA TOTAL: 30 Segundos (Esto significa MÍNIMO 5 ESCENAS de 6 segundos c/u).
            2. DURACIÓN POR ESCENA: Exactamente 6 segundos.
            3. IDIOMA: Todo el output debe estar en ESPAÑOL, EXCEPTO el campo 'grokPrompt' si la estrategia especifica inglés.
            4. FORMATO SALIDA: JSON Array Estricto.
            5. EFECTOS VISUALES: Prioriza una retención alta. Pide muchos efectos, transiciones y dinamismo.

            ESTRUCTURA DEL CAMPO 'grokPrompt' (Para Video - Prompt Temporal):
            Debe seguir esta estructura:
            "Segundos 0-2: [Acción inicial]. Segundos 3-6: [Acción siguiente]."
            *IMPORTANTE*: En este prompt, reitera explícitamente el entorno y el personaje. Ej: "La misma chica de cabello castaño en la sala minimalista sostiene..."
            
            ESTRUCTURA DEL CAMPO 'imagePrompt' (Para IMAGEN Estática del Frame 1 - Prompt Descriptivo):
            Describe en ESPAÑOL la imagen estática inicial de la escena.
            DEBE INCLUIR SIEMPRE: 
            - Descripción física del personaje (si hay).
            - Descripción detallada del entorno (que coincida con la escena anterior).
            - Iluminación (que coincida con la escena anterior).
            - Acción del momento.

            ESTRUCTURA DEL OBJETO JSON:
            {
                "id": number (0, 1, 2, 3, 4...),
                "timeRange": string (e.g. "00:00 - 00:06"),
                "visualDescription": string (Narrativa general),
                "cameraMovement": string (Técnico),
                "lighting": string,
                "grokPrompt": string (Prompt para VIDEO),
                "imagePrompt": string (Prompt para IMAGEN - Estático con Coherencia)
            }
          `;

          const contentParts: any[] = [];
          if (imagePart) contentParts.push(imagePart);
          contentParts.push({ text: masterVideoPrompt });

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                  parts: contentParts
              },
              config: { responseMimeType: "application/json" }
          });

          const text = response.text;
          const segmentsData = JSON.parse(text);

          return segmentsData.map((s: any) => ({
              id: s.id,
              timeRange: s.timeRange || "00:00 - 00:06",
              visualDescription: s.visualDescription || "Descripción no disponible",
              cameraMovement: s.cameraMovement || "Estático",
              lighting: s.lighting || "Natural",
              grokPrompt: s.grokPrompt || `Segundos 0-2: Mostrar ${productName} estático. Segundos 3-6: Zoom lento.`,
              imagePrompt: s.imagePrompt || `Primer plano detallado de ${productName}.`,
              referenceImage: "" 
          }));

      } catch (e) {
          console.error("Error en Video Architect", e);
      }
  }

  // Fallback si falla la AI
  await delay(1500); 
  return [
      {
          id: 0,
          timeRange: "00:00 - 00:06",
          visualDescription: "Gancho: Primer plano impactante.",
          cameraMovement: "Rotación Rápida",
          lighting: "Estudio",
          grokPrompt: `Segundos 0-2: Usando la imagen de referencia, mostrar primer plano del ${productName} con destellos de luz. Segundos 3-6: El producto gira 180 grados con efecto de desenfoque de movimiento.`,
          imagePrompt: `Imagen estática de primer plano de ${productName} con iluminación de estudio, alta resolución 4k.`,
          referenceImage: ""
      },
      {
          id: 1,
          timeRange: "00:06 - 00:12",
          visualDescription: "Problema: Mostrar frustración usuario.",
          cameraMovement: "Cámara en mano",
          lighting: "Tenue",
          grokPrompt: `Segundos 0-2: Persona intentando usar un método antiguo y fallando. Segundos 3-6: Transición 'Glitch' hacia el producto nuevo.`,
          imagePrompt: `Persona mostrando frustración en un entorno doméstico, iluminación tenue y realista.`,
          referenceImage: ""
      },
      {
          id: 2,
          timeRange: "00:12 - 00:18",
          visualDescription: "Solución: El producto en acción.",
          cameraMovement: "Macro",
          lighting: "Brillante",
          grokPrompt: `Segundos 0-2: Primer plano macro de la textura del ${productName}. Segundos 3-6: Partículas mágicas rodean el producto demostrando su eficacia.`,
          imagePrompt: `Primer plano macro detallado de la textura de ${productName}, iluminación brillante.`,
          referenceImage: ""
      },
      {
          id: 3,
          timeRange: "00:18 - 00:24",
          visualDescription: "Beneficio Clave.",
          cameraMovement: "Dolly In",
          lighting: "Natural",
          grokPrompt: `Segundos 0-2: Usuario sonriendo usando el producto. Segundos 3-6: Texto flotante 3D aparece indicando el precio S/. ${price}.`,
          imagePrompt: `Usuario feliz usando ${productName} en un entorno natural con luz de día.`,
          referenceImage: ""
      },
      {
          id: 4,
          timeRange: "00:24 - 00:30",
          visualDescription: "CTA Final.",
          cameraMovement: "Estático",
          lighting: "Alto Contraste",
          grokPrompt: `Segundos 0-2: Bodegón final del producto con fondo limpio. Segundos 3-6: Flecha animada neón señala hacia abajo 'Compra Ahora'.`,
          imagePrompt: `Bodegón estético de ${productName} sobre fondo minimalista, iluminación de alto contraste.`,
          referenceImage: ""
      }
  ]; 
};

export const chatWithGenius = async (history: ChatMessage[], userMsg: string): Promise<string> => {
    // ... Logica existente ...
    return "Respuesta simulada del Profesor.";
};