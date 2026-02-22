import { ref } from 'vue'
import axios from 'axios'

export function useTranslate() {
  const translating = ref(false)
  const translateError = ref('')

  function authHeader() {
    return { Authorization: `Basic ${sessionStorage.getItem('admin_token') ?? ''}` }
  }

  async function translateToSpanish(texts: string[]): Promise<string[]> {
    translating.value = true
    translateError.value = ''
    try {
      const res = await axios.post(
        '/api/v1/admin/translate',
        { texts, targetLang: 'es' },
        { headers: authHeader() }
      )
      return res.data.translated as string[]
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      translateError.value = msg ?? 'Translation failed. Check that GROQ_API_KEY is configured.'
      return texts // return originals on failure
    } finally {
      translating.value = false
    }
  }

  return { translating, translateError, translateToSpanish }
}
