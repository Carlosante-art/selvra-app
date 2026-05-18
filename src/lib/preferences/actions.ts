'use server'

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/config'
import {
  disableCommunicationPreference,
  writeCommunicationPreference,
} from '@/lib/protocol/client'

export type ActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function addPreferenceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { status: 'error', message: 'Inte inloggad' }
  }

  const rawUtterance = String(formData.get('raw_utterance') ?? '').trim()
  const categoryRaw = String(formData.get('category') ?? '').trim()
  const category = categoryRaw && categoryRaw !== 'none' ? categoryRaw : null

  if (!rawUtterance) {
    return {
      status: 'error',
      message: 'Skriv en preferens innan du sparar.',
    }
  }
  if (rawUtterance.length > 500) {
    return {
      status: 'error',
      message: `För lång (max 500 tecken, ${rawUtterance.length} angivet).`,
    }
  }

  try {
    const result = await writeCommunicationPreference({
      rawUtterance,
      category,
    })
    revalidatePath('/preferences')
    const verb = result.status === 'created' ? 'Sparad' : 'Återaktiverad'
    return { status: 'success', message: verb }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      status: 'error',
      message: message.includes('third-person')
        ? 'Skriv i första person — som om du säger det själv till AI:n.'
        : `Kunde inte spara: ${message}`,
    }
  }
}

export async function disablePreferenceAction(
  preferenceId: string,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { status: 'error', message: 'Inte inloggad' }
  }

  try {
    await disableCommunicationPreference(preferenceId)
    revalidatePath('/preferences')
    return { status: 'success', message: 'Inaktiverad' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', message: `Kunde inte inaktivera: ${message}` }
  }
}
