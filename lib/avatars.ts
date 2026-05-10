// Helper para generar URL de avatar por jugador.
// Usa Pravatar (banco de imágenes públicas, fotos reales de personas) determinístico por ID.
// Cuando hay foto real cargada (player.photo_url), tiene precedencia.
//
// Nota para producción: las fotos subidas deberían redimensionarse a ~256px de lado
// y comprimirse antes de guardar en Supabase Storage para que los avatars carguen rápido.

// Hash simple del id+nombre → número 1-70 para Pravatar (tienen 70 fotos indexadas)
function hashToImageIndex(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 70) + 1
}

export function getAvatarUrl(player: { id: string; full_name: string; photo_url?: string | null }): string {
  if (player.photo_url) return player.photo_url
  // Pravatar — fotos reales de personas de banco gratuito, determinístico por seed
  const idx = hashToImageIndex(player.id + player.full_name)
  return `https://i.pravatar.cc/150?img=${idx}`
}

// Avatar para profes/tutores/adultos — fotos diferentes a las de jugadores (offset)
export function getAdultAvatarUrl(person: { id: string; full_name: string; photo_url?: string | null }): string {
  if (person.photo_url) return person.photo_url
  // Usamos `?u=seed` que devuelve fotos randomizadas pero estables por seed (no del set indexado de 70)
  const seed = encodeURIComponent(person.id + person.full_name)
  return `https://i.pravatar.cc/150?u=${seed}`
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
