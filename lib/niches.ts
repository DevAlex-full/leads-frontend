export interface NicheSuggestion {
  label: string
  value: string
  icon: string
  category: string
}

export const NICHE_SUGGESTIONS: NicheSuggestion[] = [
  // Beleza & Estética
  { label: 'Barbearia', value: 'barbearia', icon: '💈', category: 'Beleza & Estética' },
  { label: 'Salão de Beleza', value: 'salão de beleza', icon: '💇', category: 'Beleza & Estética' },
  { label: 'Clínica Estética', value: 'clínica estética', icon: '✨', category: 'Beleza & Estética' },
  { label: 'Manicure & Nail Art', value: 'manicure', icon: '💅', category: 'Beleza & Estética' },
  { label: 'Sobrancelhas & Lashes', value: 'sobrancelhas design', icon: '👁️', category: 'Beleza & Estética' },
  // Saúde
  { label: 'Clínica Odontológica', value: 'clínica odontológica', icon: '🦷', category: 'Saúde' },
  { label: 'Clínica Médica', value: 'clínica médica', icon: '🏥', category: 'Saúde' },
  { label: 'Psicólogo', value: 'psicólogo consultório', icon: '🧠', category: 'Saúde' },
  { label: 'Fisioterapia', value: 'fisioterapia clínica', icon: '🤸', category: 'Saúde' },
  { label: 'Nutricionista', value: 'nutricionista consultório', icon: '🥗', category: 'Saúde' },
  // Fitness
  { label: 'Academia de Ginástica', value: 'academia ginástica', icon: '🏋️', category: 'Fitness' },
  { label: 'Personal Trainer', value: 'personal trainer', icon: '💪', category: 'Fitness' },
  { label: 'Pilates', value: 'pilates estúdio', icon: '🧘', category: 'Fitness' },
  { label: 'Crossfit', value: 'crossfit box', icon: '🏆', category: 'Fitness' },
  // Pets
  { label: 'Pet Shop', value: 'pet shop', icon: '🐶', category: 'Pets' },
  { label: 'Veterinário', value: 'veterinário clínica', icon: '🐾', category: 'Pets' },
  { label: 'Hotel & Day Care Pet', value: 'hotel para cães', icon: '🏠', category: 'Pets' },
  // Alimentação
  { label: 'Restaurante', value: 'restaurante', icon: '🍽️', category: 'Alimentação' },
  { label: 'Lanchonete & Café', value: 'lanchonete cafeteria', icon: '☕', category: 'Alimentação' },
  // Automotivo
  { label: 'Oficina Mecânica', value: 'oficina mecânica', icon: '🔧', category: 'Automotivo' },
  { label: 'Lava-Rápido & Estética', value: 'lava rápido estética automotiva', icon: '🚗', category: 'Automotivo' },
  // Serviços
  { label: 'Advocacia', value: 'escritório advocacia', icon: '⚖️', category: 'Serviços' },
  { label: 'Contabilidade', value: 'escritório contabilidade', icon: '📊', category: 'Serviços' },
  { label: 'Imobiliária', value: 'imobiliária', icon: '🏢', category: 'Serviços' },
]

export const NICHE_CATEGORIES = [
  ...new Set(NICHE_SUGGESTIONS.map((n) => n.category)),
]
