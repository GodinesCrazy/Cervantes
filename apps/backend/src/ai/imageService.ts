interface ImageGenerationResult {
  url?: string;
  base64?: string;
  buffer?: Buffer;
  provider: string;
  error?: string;
}

export class ImageGenerationService {
  private falKey = process.env.FAL_API_KEY;
  private stabilityKey = process.env.STABILITY_API_KEY;

  async generateImage(prompt: string, options?: { orientation?: 'portrait' | 'landscape' | 'square' }): Promise<ImageGenerationResult> {
    const orientation = options?.orientation || 'square';
    
    // 1. Try Fal.ai (Flux)
    if (this.falKey && this.falKey !== 'placeholder') {
      try {
        console.log('[ImageService] Intentando generar con fal.ai (Flux)...');
        
        // Map orientation to fal.ai image sizes
        let image_size = 'square_hd';
        if (orientation === 'portrait') image_size = 'portrait_4_3';
        if (orientation === 'landscape') image_size = 'landscape_4_3';

        const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${this.falKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            image_size,
            num_images: 1
          })
        });

        if (res.ok) {
          const data = await res.json() as any;
          if (data.images && data.images.length > 0) {
            console.log('[ImageService] Imagen generada con fal.ai');
            return { url: data.images[0].url, provider: 'fal' };
          }
        } else {
          console.error(`[ImageService] fal.ai falló con status ${res.status}:`, await res.text());
        }
      } catch (err) {
        console.error('[ImageService] Error en fal.ai:', err);
      }
    }

    // 2. Try Stability AI (SDXL v1 JSON endpoint)
    if (this.stabilityKey && this.stabilityKey !== 'placeholder') {
      try {
        console.log('[ImageService] Intentando generar con Stability AI (SDXL)...');
        // Valid SDXL dimensions
        let height = 1024;
        let width = 1024;
        if (orientation === 'portrait') {
          height = 1152;
          width = 896;
        } else if (orientation === 'landscape') {
          height = 896;
          width = 1152;
        }

        const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.stabilityKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt, weight: 1 }],
            cfg_scale: 7,
            height,
            width,
            samples: 1,
            steps: 30
          })
        });

        if (res.ok) {
          const data = await res.json() as any;
          if (data.artifacts && data.artifacts.length > 0) {
            console.log('[ImageService] Imagen generada con Stability AI');
            return { base64: data.artifacts[0].base64, provider: 'stability' };
          }
        } else {
          console.error(`[ImageService] Stability AI falló con status ${res.status}:`, await res.text());
        }
      } catch (err) {
        console.error('[ImageService] Error en Stability AI:', err);
      }
    }

    // 3. Fallback: Pollinations (Free, No Auth required)
    try {
      console.log('[ImageService] Intentando generar con Pollinations (Fallback)...');
      let width = 1024;
      let height = 1024;
      if (orientation === 'landscape') {
        width = 1024; height = 768;
      } else if (orientation === 'portrait') {
        width = 768; height = 1024;
      }
      
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
      
      const res = await fetch(url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        console.log('[ImageService] Imagen generada con Pollinations');
        return { buffer: Buffer.from(arrayBuffer), provider: 'pollinations' };
      }
    } catch (err) {
      console.error('[ImageService] Error en Pollinations:', err);
    }

    return { error: 'All image providers failed', provider: 'none' };
  }
}
