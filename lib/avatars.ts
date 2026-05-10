// Helper para generar URL de avatar por jugador.
// Usa Pravatar (banco de imágenes públicas, fotos reales de personas) determinístico por ID.
// Cuando hay foto real cargada (player.photo_url), tiene precedencia.
//
// Nota para producción: las fotos subidas deberían redimensionarse a ~256px de lado
// y comprimirse antes de guardar en Supabase Storage para que los avatars carguen rápido.

export function getAvatarUrl(player: { id: string; full_name: string; photo_url?: string | null }): string {
  if (player.photo_url) return player.photo_url
  // DiceBear 'lorelei' — ilustración cara amigable, profesional, apropiada para chicos
  // Estilo similar a Apple Memoji o Notion avatars. Determinístico por seed.
  const seed = encodeURIComponent(player.id + player.full_name)
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=00843d,c9a84c,1d4ed8,7c3aed,16a34a,f59e0b,ec4899,0891b2&backgroundType=gradientLinear`
}

// Avatar para profes/tutores/adultos — usa el mismo estilo lorelei (sirve para ambos)
export function getAdultAvatarUrl(person: { id: string; full_name: string; photo_url?: string | null }): string {
  if (person.photo_url) return person.photo_url
  const seed = encodeURIComponent('adult-' + person.id + person.full_name)
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=6b7280,4b5563,374151&backgroundType=gradientLinear`
}

// Comprime una imagen subida (data URL) a un tamaño razonable para avatar
export async function compressImageForAvatar(file: File, maxSize = 256, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
