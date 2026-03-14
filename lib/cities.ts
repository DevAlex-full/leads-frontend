export interface City {
  name: string
  state: string
  region: 'Sudeste' | 'Sul' | 'Nordeste' | 'Norte' | 'Centro-Oeste'
}

export const CITIES: City[] = [
  { name: 'São Paulo', state: 'SP', region: 'Sudeste' },
  { name: 'Campinas', state: 'SP', region: 'Sudeste' },
  { name: 'Ribeirão Preto', state: 'SP', region: 'Sudeste' },
  { name: 'Santo André', state: 'SP', region: 'Sudeste' },
  { name: 'Sorocaba', state: 'SP', region: 'Sudeste' },
  { name: 'Rio de Janeiro', state: 'RJ', region: 'Sudeste' },
  { name: 'Niterói', state: 'RJ', region: 'Sudeste' },
  { name: 'Nova Iguaçu', state: 'RJ', region: 'Sudeste' },
  { name: 'Belo Horizonte', state: 'MG', region: 'Sudeste' },
  { name: 'Contagem', state: 'MG', region: 'Sudeste' },
  { name: 'Curitiba', state: 'PR', region: 'Sul' },
  { name: 'Porto Alegre', state: 'RS', region: 'Sul' },
  { name: 'Florianópolis', state: 'SC', region: 'Sul' },
  { name: 'Joinville', state: 'SC', region: 'Sul' },
  { name: 'Salvador', state: 'BA', region: 'Nordeste' },
  { name: 'Fortaleza', state: 'CE', region: 'Nordeste' },
  { name: 'Recife', state: 'PE', region: 'Nordeste' },
  { name: 'Natal', state: 'RN', region: 'Nordeste' },
  { name: 'Maceió', state: 'AL', region: 'Nordeste' },
  { name: 'João Pessoa', state: 'PB', region: 'Nordeste' },
  { name: 'Teresina', state: 'PI', region: 'Nordeste' },
  { name: 'Aracaju', state: 'SE', region: 'Nordeste' },
  { name: 'São Luís', state: 'MA', region: 'Nordeste' },
  { name: 'Manaus', state: 'AM', region: 'Norte' },
  { name: 'Belém', state: 'PA', region: 'Norte' },
  { name: 'Porto Velho', state: 'RO', region: 'Norte' },
  { name: 'Goiânia', state: 'GO', region: 'Centro-Oeste' },
  { name: 'Campo Grande', state: 'MS', region: 'Centro-Oeste' },
  { name: 'Cuiabá', state: 'MT', region: 'Centro-Oeste' },
  { name: 'Brasília', state: 'DF', region: 'Centro-Oeste' },
]

export const REGIONS = ['Sudeste', 'Sul', 'Nordeste', 'Norte', 'Centro-Oeste'] as const
export type Region = (typeof REGIONS)[number]
