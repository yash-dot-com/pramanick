export const LANGUAGE_LABELS = {
  mr: "मराठी",
  hi: "हिन्दी / Hinglish",
  en: "English",
} as const
export type VoiceLanguage = keyof typeof LANGUAGE_LABELS
export function voiceLanguage(value?: string): VoiceLanguage {
  return value === "hi" || value === "en" || value === "mr" ? value : "mr"
}
export function languageVariables(value?: string, intake = false) {
  const language = voiceLanguage(value)
  return {
    preferred_language: language,
    language_instruction:
      language === "mr"
        ? "Speak Marathi in Devanagari from your very first response. Do not default to Hindi. Keep civic terms clear and ask one short question at a time."
        : language === "hi"
          ? "Speak Hindi or natural Hinglish from your first response. Ask one short question at a time."
          : "Speak clear Indian English from your first response. Ask one short question at a time.",
    voice_greeting:
      language === "mr"
        ? `नमस्कार! मी प्रामाणिकचा एआय सहाय्यक आहे. ${intake ? "तुमच्या परिसरात कोणती समस्या आहे ते सांगा." : "या तक्रारीबद्दल आपण बोलूया."}`
        : language === "hi"
          ? `नमस्ते! मैं प्रामाणिक का एआई सहायक हूँ। ${intake ? "अपने इलाके की समस्या बताइए।" : "इस शिकायत के बारे में बात करते हैं।"}`
          : `Hello! I’m Pramanik’s AI assistant. ${intake ? "What needs fixing in your area?" : "Let’s discuss this complaint."}`,
  }
}
