// Default/fallback categories (used when API is unavailable)
export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Alimentación', description: 'Comida y bebidas', color: '#FF6384' },
  { id: 2, name: 'Transporte', description: 'Movilidad y gasolina', color: '#36A2EB' },
  { id: 3, name: 'Vivienda', description: 'Arriendo y servicios', color: '#FFCE56' },
  { id: 4, name: 'Salud', description: 'Médicos y medicamentos', color: '#4BC0C0' },
  { id: 5, name: 'Entretenimiento', description: 'Ocio y diversión', color: '#9966FF' },
  { id: 6, name: 'Educación', description: 'Cursos y libros', color: '#FF9F40' },
  { id: 7, name: 'Ropa', description: 'Vestimenta y calzado', color: '#C9CBCF' },
  { id: 8, name: 'Otros', description: 'Gastos varios', color: '#7C8798' },
] as const;
