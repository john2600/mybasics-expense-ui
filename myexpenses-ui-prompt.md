# Prompt: MyExpenses-UI

## Descripción General

Crea una aplicación web llamada **"myexpenses-ui"** - un administrador de finanzas personales moderno y responsive usando React 18+ con TypeScript y Tailwind CSS.

---

## Stack Tecnológico

- **React 18+** con TypeScript
- **Tailwind CSS** para estilos
- **Recharts** para gráficos (torta y barras)
- **React Query (TanStack Query)** para manejo de estado del servidor
- **date-fns** para manejo de fechas

---

## Integración con Backend

> ⚠️ **IMPORTANTE**: La configuración de APIs, endpoints, autenticación y manejo de errores HTTP está documentada en el archivo `api-reference.md`. Consultar ese documento para toda la implementación de consumo de servicios externos.

La aplicación está diseñada para consumir APIs REST de un backend externo. Los servicios y hooks deben estar preparados para:

- Realizar llamadas en paralelo cuando sea necesario
- Manejar estados de loading, error y success
- Renderizar los datos en los componentes correspondientes una vez cargados

---

## Arquitectura de la Aplicación

### Estructura de Carpetas

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── MonthlyComparison.tsx
│   │   └── DailyMovements.tsx
│   ├── charts/
│   │   ├── ExpensesByCategoryPieChart.tsx
│   │   └── IncomeExpensesBarChart.tsx
│   ├── movements/
│   │   ├── MovementsList.tsx
│   │   ├── MovementItem.tsx
│   │   └── AddMovementForm.tsx
│   └── common/
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Loading.tsx
│       └── ErrorMessage.tsx
├── hooks/
│   ├── useMovements.ts
│   ├── useCategories.ts
│   ├── useDashboardData.ts
│   └── useFinancialSummary.ts
├── services/
│   └── (ver API_INTEGRATION.md)
├── types/
│   └── index.ts
├── utils/
│   └── formatters.ts
└── constants/
    └── categories.ts
```

---

## Tipos de Datos

```typescript
// types/index.ts

type MovementType = 'income' | 'expense';

interface Movement {
  id: string;
  type: MovementType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO format
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: MovementType;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: CategorySummary[];
  incomesByCategory: CategorySummary[];
}

interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}
```

NOTA IMPORTANTE: Estos tipos de datos no son definitivos deben matchear con los de la api-reference.md para tener compatibilidad, si es necesario ajustar
---

## Funcionalidades Principales

### 1. Dashboard Principal

**Summary Cards** - 4 tarjetas mostrando:
- Ingresos del "mes" actual, en realidad es dado una fecha de corte, porque el mes el corte puede empezar el 7 o el 23 del mes. haz que pueda ser configurable
- Gastos del mes actual aplica lo mismo los gastos son de un rango no del 1 al 30, sino de un rango dado por ejemplo del 1 al 30, o del 7 al 6 del otro mes,
- Balance actual  es la resta y lo que va quedando entre ingresos y gastos
- Comparación con mes anterior (porcentaje de cambio) 

**Comparación Mensual**:
- Vista del mes actual vs mes anterior, igualmente del mismo rango porque permitiria comparar
- Indicadores visuales de tendencia (arriba/abajo)

---

### 2. Gráficos

#### Gráfico de Torta (Pie Chart)
- Distribución de gastos por categoría
- Colores distintos por categoría desde el backend viene el color sino viene agrega uno por defecto para cada categoria
- Leyenda con porcentajes
- Tooltip interactivo con montos

#### Gráfico de Barras (Bar Chart)
- Comparación ingresos vs gastos por período
- Barras agrupadas:
  - Ingresos: color verde
  - Gastos: color rojo
- Eje Y con formato de moneda
- Si el balance es negativo muestra en rojo si es positivo muestra en verde.

---

### 3. Movimientos Diarios

- Lista de movimientos dado el filtro que se le de puede ser la misma fecha del corte de 1 a 30 o del 7 al 6 del otro mes segun ese rango 
- Filtros disponibles:
  - Por fecha
  - Por categoría
  - Por tipo (ingreso/gasto) 
- Ordenamiento por fecha (más reciente primero)
- Indicador visual:
  - Ingreso: verde con icono ↑
  - Gasto: rojo con icono ↓
- Botón para agregar nuevo movimiento

---

## Categorías Predefinidas

```typescript
// constants/categories.ts

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentación', icon: '🍔', color: '#FF6384', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#36A2EB', type: 'expense' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬', color: '#FFCE56', type: 'expense' },
  { id: 'health', name: 'Salud', icon: '💊', color: '#4BC0C0', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛒', color: '#9966FF', type: 'expense' },
  { id: 'bills', name: 'Servicios', icon: '📄', color: '#FF9F40', type: 'expense' },
  { id: 'education', name: 'Educación', icon: '📚', color: '#C9CBCF', type: 'expense' },
  { id: 'other', name: 'Otros', icon: '📦', color: '#7C8798', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salario', icon: '💰', color: '#4CAF50', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#8BC34A', type: 'income' },
  { id: 'investment', name: 'Inversiones', icon: '📈', color: '#CDDC39', type: 'income' },
  { id: 'other_income', name: 'Otros ingresos', icon: '💵', color: '#009688', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
```

Esto tiene que hacer match con la api-reference.md
---

## Diseño UI/UX

### Layout General

- **Header**: Fijo con logo "MyExpenses"
- **Sidebar**: Navegación principal, colapsable en mobile (hamburger menu)
- **Main Content**: Área principal con grid responsive
- **Footer**: Mínimo (opcional)

### Responsive Breakpoints

| Breakpoint | Tamaño | Comportamiento |
|------------|--------|----------------|
| Mobile | < 640px | 1 columna, sidebar como drawer |
| Tablet | 640px - 1024px | 2 columnas |
| Desktop | > 1024px | Layout completo con sidebar visible |

### Paleta de Colores

```
Primary:          #3B82F6 (blue-500)
Success/Income:   #10B981 (green-500)
Danger/Expense:   #EF4444 (red-500)
Warning:          #F59E0B (amber-500)
Background:       #F9FAFB (gray-50)
Cards:            #FFFFFF
Text Primary:     #1F2937 (gray-800)
Text Secondary:   #6B7280 (gray-500)
```

### Estados de UI

| Estado | Implementación |
|--------|----------------|
| **Loading** | Skeletons en cards y gráficos |
| **Empty** | Ilustración + mensaje "No hay movimientos" + CTA para agregar |
| **Error** | Mensaje de error + botón de reintentar |
| **Success** | Toast notification para acciones completadas |

---

## Componentes Core

### Card Component

```typescript
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}
```

### SummaryCard Component

```typescript
interface SummaryCardProps {
  title: string;
  value: number;
  previousValue?: number;
  type: 'income' | 'expense' | 'balance' | 'neutral';
  loading?: boolean;
}
```

### MovementItem Component

```typescript
interface MovementItemProps {
  movement: Movement;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}
```

---

## Custom Hooks

### useDashboardData

Hook principal que orquesta la carga de datos del dashboard. Debe manejar:
- Carga de múltiples recursos
- Estado consolidado de loading
- Manejo de errores
- Refetch cuando sea necesario

### useMovements

Hook para operaciones CRUD de movimientos:
- Listar movimientos (con filtros)
- Crear movimiento
- Actualizar movimiento
- Eliminar movimiento

### useFinancialSummary

Hook para obtener resúmenes financieros:
- Totales por período
- Agrupaciones por categoría
- Comparaciones entre períodos

---

## Notas de Implementación

1. **Componentes funcionales** con hooks exclusivamente
2. **Custom hooks** para lógica reutilizable y separación de concerns
3. **React.memo** en componentes pesados (gráficos) para optimizar renders
4. **Error boundaries** para capturar errores de renderizado
5. **Accesibilidad básica**: aria-labels, keyboard navigation, focus management
6. **Animaciones sutiles** usando Tailwind transitions/animations

---

## Orden de Implementación Sugerido

1. Setup del proyecto (Vite + React + TypeScript + Tailwind)
2. Estructura de carpetas y tipos base
3. Componentes de layout (Header, Sidebar, MainLayout)
4. Componentes comunes (Card, Button, Loading, ErrorMessage)
5. Dashboard con SummaryCards
6. Lista de movimientos diarios
7. Gráficos (Pie Chart y Bar Chart)
8. Formulario de agregar/editar movimiento
9. Integración con APIs (según `API_INTEGRATION.md`)
10. Estados de loading, error y empty
11. Responsive y polish final

---

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `api-reference.md` | Configuración de endpoints, autenticación y manejo de APIs |
| `README.md` | Instrucciones de instalación y desarrollo |
| `.env.example` | Variables de entorno necesarias |

---

## Funcionalidades Futuras (Backlog) por ahora no van estos features.

- [ ] Exportación a CSV
- [ ] Modo oscuro
- [ ] Autenticación/Login
- [ ] Múltiples cuentas/wallets
- [ ] Presupuestos por categoría
- [ ] Notificaciones de gastos
- [ ] PWA para uso offline

Creame /init con claude para tener una documentacion del proyecto
