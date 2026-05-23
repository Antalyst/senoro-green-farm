export const PH_CITIES = [
  'Bago City',
  'Bacolod City',
  'Talisay City',
  'Silay City',
  'Hinigaran',
  'Pulupandan',
] as const

export type PhCity = typeof PH_CITIES[number]

export const PH_BARANGAYS: Record<PhCity, string[]> = {
  'Bago City': [
    'Abuanan',
    'Alianza',
    'Atipuluan',
    'Bacong-Montilla',
    'Bagroy',
    'Balingasag',
    'Binubuhan',
    'Busay',
    'Calumangan',
    'Caridad',
    'Don Jorge L. Araneta',
    'Dulao',
    'Ilijan',
    'Lag-Asan',
    'Ma-ao',
    'Mailum',
    'Malingin',
    'Napoles',
    'Pacol',
    'Poblacion',
    'Sagasa',
    'Sampinit',
    'Tabunan',
    'Taloc',
  ],
  'Bacolod City': [
    'Alijis',
    'Banago',
    'Barangay 1',
    'Estefania',
    'Mandalagan',
    'Tangub',
    'Villamonte',
  ],
  'Talisay City': [
    'Bubog',
    'Cabatangan',
    'Concepcion',
    'Dos Hermanas',
    'Efigenio Lizares',
    'Katilingban',
    'Matab-ang',
    'Zone 1',
  ],
  'Silay City': [
    'Balaring',
    'Barangay I',
    'Guinhalaran',
    'Kapitan Ramon',
    'Mambukal',
    'Rizal',
  ],
  'Hinigaran': [
    'Anahaw',
    'Aranda',
    'Barangay I',
    'Gargato',
    'Palayog',
    'Tagda',
  ],
  'Pulupandan': [
    'Barangay Zone I',
    'Canjusa',
    'Crossing Pulupandan',
    'Mabini',
    'Pag-ayon',
    'Utod',
  ],
}

export function barangaysForCity(city: string): string[] {
  return PH_BARANGAYS[city as PhCity] ?? PH_BARANGAYS['Bago City']
}
