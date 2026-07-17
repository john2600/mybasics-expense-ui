# MyExpenses — API Reference

Documento técnico para el equipo de frontend. Cubre todos los endpoints disponibles, modelos de datos, contratos de request/response y ejemplos de uso.

---

## Tabla de contenidos

- [Convenciones generales](#convenciones-generales)
- [Envelope de respuesta](#envelope-de-respuesta)
- [Códigos de estado HTTP](#códigos-de-estado-http)
- [Modelos](#modelos)
- [Endpoints](#endpoints)
  - [Categorías](#categorías)
  - [Movimientos](#movimientos)
  - [Balance](#balance)
  - [Periodos con carry-over](#periodos-con-carry-over)
  - [Ingreso fijo](#ingreso-fijo)
- [Guía de componentes UI](#guía-de-componentes-ui)
---

## Convenciones generales

| Campo | Valor |
|---|---|
| Base URL | `http://localhost:8082/api/v1` |
| Content-Type | `application/json` |
| Formato de fechas | `YYYY-MM-DD` |
| Formato de horas | `HH:MM:SS` |
| Moneda | Pesos colombianos (COP), sin símbolo |

---

## Envelope de respuesta

Todas las respuestas están envueltas en un objeto `Envelope`:

```json
{
  "data": { ... },
  "error": "mensaje de error",
  "message": "mensaje informativo"
}
```

| Campo | Tipo | Presencia |
|---|---|---|
| `data` | `any` | Solo en respuestas exitosas |
| `error` | `string` | Solo en respuestas de error |
| `message` | `string` | Opcional, informativo |

**Respuesta exitosa:**
```json
{
  "data": { ... }
}
```

**Respuesta de error:**
```json
{
  "error": "descripción del error"
}
```

---

## Códigos de estado HTTP

| Código | Significado |
|---|---|
| `200 OK` | Operación exitosa |
| `201 Created` | Recurso creado exitosamente |
| `204 No Content` | Eliminación exitosa (sin body) |
| `400 Bad Request` | Payload inválido o parámetros incorrectos |
| `404 Not Found` | Recurso no encontrado |
| `500 Internal Server Error` | Error del servidor |

---

## Modelos

### Category

```typescript
{
  id:          number    // identificador único
  name:        string    // nombre de la categoría
  description: string    // descripción
  color:       string    // color hex (ej: "#FF5733")
  created_at:  string    // ISO 8601
  updated_at:  string    // ISO 8601
}
```

### Movement

```typescript
{
  id:               number    // identificador único
  category_id:      number    // referencia a Category.id
  category:         string    // nombre de la categoría (join)
  type:             "E" | "I" // E = Egreso (gasto), I = Ingreso
  amount:           number    // valor en COP
  description:      string    // descripción del movimiento
  date:             string    // fecha YYYY-MM-DD
  hour:             string    // hora HH:MM:SS (puede ser null)
  transaction_type: string    // tipo de transacción bancaria (puede ser null)
  mail_uid:         number    // UID del correo origen (puede ser null)
  mail_message_id:  string    // Message-ID del correo origen (puede ser null)
  created_at:       string    // ISO 8601
  updated_at:       string    // ISO 8601
}
```

### GroupedByCategory

```typescript
{
  category:  string      // nombre de la categoría
  total:     number      // suma de amounts del grupo
  movements: Movement[]  // lista de movimientos del grupo
}
```

### MonthlySummary

```typescript
{
  year:  number  // año (ej: 2026)
  month: number  // mes 1-12
  total: number  // suma de gastos del mes
}
```

### IncomeConfig

```typescript
{
  amount:      number  // ingreso fijo mensual en COP
  cut_day:     number  // día de corte del mes (1-28)
  description: string  // etiqueta del ingreso
  updated_at:  string  // ISO 8601
}
```

### BalanceSummary

```typescript
{
  expenses:      number        // total de egresos en el periodo
  incomes:       number        // total de ingresos registrados en el periodo
  balance:       number        // (income_config.amount + incomes) - expenses
  income_config: IncomeConfig  // configuración de ingreso fijo
}
```

---

## Endpoints

---

## Categorías

### `GET /categories`

Retorna todas las categorías disponibles.

**Query params:** ninguno

**Request:**
```bash
curl http://localhost:8082/api/v1/categories
```

**Response `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Alimentacion",
      "description": "Gastos de comida y restaurantes",
      "color": "#FF5733",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Transporte",
      "description": "Uber, taxi, gasolina",
      "color": "#33A1FF",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /categories/{id}`

Retorna una categoría por ID.

**Path params:**

| Param | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID de la categoría |

**Request:**
```bash
curl http://localhost:8082/api/v1/categories/1
```

**Response `200`:**
```json
{
  "data": {
    "id": 1,
    "name": "Alimentacion",
    "description": "Gastos de comida y restaurantes",
    "color": "#FF5733",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

**Response `404`:**
```json
{
  "error": "category not found"
}
```

---

## Movimientos

### `GET /movements`

Retorna todos los movimientos agrupados por categoría. Soporta filtros opcionales.

**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `"E"` \| `"I"` | No | Filtra por tipo: E = gasto, I = ingreso |
| `category_id` | `number` | No | Filtra por categoría |
| `date_from` | `YYYY-MM-DD` | No | Fecha inicio (inclusive) |
| `date_to` | `YYYY-MM-DD` | No | Fecha fin (inclusive) |
| `limit` | `number` | No | Máximo de movimientos a retornar |

**Request:**
```bash
# Todos los movimientos
curl http://localhost:8082/api/v1/movements

# Solo gastos de abril
curl "http://localhost:8082/api/v1/movements?type=E&date_from=2026-04-01&date_to=2026-04-30"

# Por categoría
curl "http://localhost:8082/api/v1/movements?category_id=3"
```

**Response `200`:**
```json
{
  "data": [
    {
      "category": "Alimentacion",
      "total": 85000,
      "movements": [
        {
          "id": 42,
          "category_id": 1,
          "category": "Alimentacion",
          "type": "E",
          "amount": 50000,
          "description": "CARULLA CEDRITOS",
          "date": "2026-04-10T00:00:00Z",
          "hour": "14:32:00",
          "transaction_type": "Compraste",
          "created_at": "2026-04-10T14:32:01Z",
          "updated_at": "2026-04-10T14:32:01Z"
        },
        {
          "id": 43,
          "category_id": 1,
          "category": "Alimentacion",
          "type": "E",
          "amount": 35000,
          "description": "RAPPI",
          "date": "2026-04-11T00:00:00Z",
          "hour": "20:15:00",
          "transaction_type": "Compraste",
          "created_at": "2026-04-11T20:15:02Z",
          "updated_at": "2026-04-11T20:15:02Z"
        }
      ]
    },
    {
      "category": "Transporte",
      "total": 25000,
      "movements": [
        {
          "id": 44,
          "category_id": 2,
          "category": "Transporte",
          "type": "E",
          "amount": 25000,
          "description": "UBER",
          "date": "2026-04-12T00:00:00Z",
          "hour": "08:10:00",
          "transaction_type": "Compraste",
          "created_at": "2026-04-12T08:10:05Z",
          "updated_at": "2026-04-12T08:10:05Z"
        }
      ]
    }
  ]
}
```

---

### `GET /movements/expenses`

Retorna lista plana de gastos (`type = 'E'`) ordenados del más reciente al más antiguo. Útil para dashboard y últimos movimientos.

**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `limit` | `number` | No | Máximo de resultados (ej: 10 para los últimos 10) |
| `category_id` | `number` | No | Filtra por categoría |
| `date_from` | `YYYY-MM-DD` | No | Fecha inicio (inclusive) |
| `date_to` | `YYYY-MM-DD` | No | Fecha fin (inclusive) |

**Request:**
```bash
# Últimos 10 gastos
curl "http://localhost:8082/api/v1/movements/expenses?limit=10"

# Gastos de abril ordenados por fecha
curl "http://localhost:8082/api/v1/movements/expenses?date_from=2026-04-01&date_to=2026-04-30"

# Últimos 5 gastos de una categoría
curl "http://localhost:8082/api/v1/movements/expenses?limit=5&category_id=1"
```

**Response `200`:**
```json
{
  "data": [
    {
      "id": 44,
      "category_id": 2,
      "category": "Transporte",
      "type": "E",
      "amount": 25000,
      "description": "UBER",
      "date": "2026-04-12T00:00:00Z",
      "hour": "08:10:00",
      "transaction_type": "Compraste",
      "created_at": "2026-04-12T08:10:05Z",
      "updated_at": "2026-04-12T08:10:05Z"
    },
    {
      "id": 43,
      "category_id": 1,
      "category": "Alimentacion",
      "type": "E",
      "amount": 35000,
      "description": "RAPPI",
      "date": "2026-04-11T00:00:00Z",
      "hour": "20:15:00",
      "transaction_type": "Compraste",
      "created_at": "2026-04-11T20:15:02Z",
      "updated_at": "2026-04-11T20:15:02Z"
    }
  ]
}
```

> **Nota:** El total de `amount` en este endpoint coincide con el campo `expenses` del endpoint `/balance` para el mismo rango de fechas.

---

### `GET /movements/summary`

Retorna el total de gastos agrupado por mes, ordenado del más reciente al más antiguo.

**Query params:** ninguno

**Request:**
```bash
curl http://localhost:8082/api/v1/movements/summary
```

**Response `200`:**
```json
{
  "data": [
    { "year": 2026, "month": 4, "total": 850000 },
    { "year": 2026, "month": 3, "total": 1200000 },
    { "year": 2026, "month": 2, "total": 980000 }
  ]
}
```

---

### `GET /movements/{id}`

Retorna un movimiento por ID.

**Path params:**

| Param | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID del movimiento |

**Request:**
```bash
curl http://localhost:8082/api/v1/movements/42
```

**Response `200`:**
```json
{
  "data": {
    "id": 42,
    "category_id": 1,
    "category": "Alimentacion",
    "type": "E",
    "amount": 50000,
    "description": "CARULLA CEDRITOS",
    "date": "2026-04-10T00:00:00Z",
    "hour": "14:32:00",
    "transaction_type": "Compraste",
    "created_at": "2026-04-10T14:32:01Z",
    "updated_at": "2026-04-10T14:32:01Z"
  }
}
```

**Response `404`:**
```json
{
  "error": "movement not found"
}
```

---

### `POST /movements`

Crea un nuevo movimiento manualmente.

**Request body:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `category_id` | `number` | Sí | Debe existir en categories |
| `type` | `"E"` \| `"I"` | No | Default: `"E"` |
| `amount` | `number` | Sí | Mayor que 0 |
| `description` | `string` | Sí | No vacío |
| `date` | `string` | Sí | Formato `YYYY-MM-DD` |
| `hour` | `string` | No | Formato `HH:MM` o `HH:MM:SS` |

**Request:**
```bash
curl --location --request POST 'http://localhost:8082/api/v1/movements' \
--header 'Content-Type: application/json' \
--data '{
  "category_id": 1,
  "type": "E",
  "amount": 45000,
  "description": "Mercado semanal",
  "date": "2026-04-17",
  "hour": "10:30"
}'
```

**Response `201`:**
```json
{
  "data": {
    "id": 101,
    "category_id": 1,
    "category": "Alimentacion",
    "type": "E",
    "amount": 45000,
    "description": "Mercado semanal",
    "date": "2026-04-17T00:00:00Z",
    "hour": "10:30",
    "created_at": "2026-04-17T10:30:00Z",
    "updated_at": "2026-04-17T10:30:00Z"
  }
}
```

**Response `400` (validación):**
```json
{
  "error": "amount must be greater than zero"
}
```

---

### `PUT /movements/{id}`

Actualiza parcialmente un movimiento. Solo se actualizan los campos enviados.

**Path params:**

| Param | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID del movimiento |

**Request body (todos opcionales):**

| Campo | Tipo | Descripción |
|---|---|---|
| `category_id` | `number` | Nueva categoría |
| `type` | `"E"` \| `"I"` | Nuevo tipo |
| `amount` | `number` | Nuevo monto |
| `description` | `string` | Nueva descripción |
| `date` | `string` | Nueva fecha `YYYY-MM-DD` |
| `hour` | `string` | Nueva hora `HH:MM:SS` |

**Request (solo re-categorizar):**
```bash
curl --location --request PUT 'http://localhost:8082/api/v1/movements/42' \
--header 'Content-Type: application/json' \
--data '{
  "category_id": 3
}'
```

**Request (actualización múltiple):**
```bash
curl --location --request PUT 'http://localhost:8082/api/v1/movements/42' \
--header 'Content-Type: application/json' \
--data '{
  "amount": 55000,
  "description": "CARULLA CEDRITOS - Actualizado",
  "category_id": 1
}'
```

**Response `200`:**
```json
{
  "data": {
    "id": 42,
    "category_id": 3,
    "category": "Compras Hogar",
    "type": "E",
    "amount": 50000,
    "description": "CARULLA CEDRITOS",
    "date": "2026-04-10T00:00:00Z",
    "hour": "14:32:00",
    "created_at": "2026-04-10T14:32:01Z",
    "updated_at": "2026-04-17T09:00:00Z"
  }
}
```

**Response `404`:**
```json
{
  "error": "movement not found"
}
```

---

### `DELETE /movements/{id}`

Elimina un movimiento por ID.

**Path params:**

| Param | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID del movimiento |

**Request:**
```bash
curl --location --request DELETE 'http://localhost:8082/api/v1/movements/42'
```

**Response `204`:** sin body

**Response `404`:**
```json
{
  "error": "movement not found"
}
```

---

## Balance

### `GET /balance`

Retorna el resumen financiero del periodo indicado: total de gastos, ingresos registrados, balance neto y configuración de ingreso fijo.

**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `date_from` | `YYYY-MM-DD` | No | Fecha inicio (inclusive). Sin valor: sin límite inferior |
| `date_to` | `YYYY-MM-DD` | No | Fecha fin (inclusive). Sin valor: sin límite superior |

**Cálculo del balance:**
```
balance = (income_config.amount + incomes) - expenses
```

**Request:**
```bash
# Balance total (sin filtro de fechas)
curl http://localhost:8082/api/v1/balance

# Balance de abril
curl "http://localhost:8082/api/v1/balance?date_from=2026-04-01&date_to=2026-04-30"
```

**Response `200`:**
```json
{
  "data": {
    "expenses": 450000,
    "incomes": 0,
    "balance": 4550000,
    "income_config": {
      "amount": 5000000,
      "cut_day": 24,
      "description": "Salario",
      "updated_at": "2026-04-01T00:00:00Z"
    }
  }
}
```

**Response `400` (fecha inválida):**
```json
{
  "error": "invalid date_from: expected YYYY-MM-DD, got \"01-04-2026\""
}
```

---

---

## Periodos con carry-over

### `GET /balance/periods`

Retorna el historial completo de periodos de corte desde el primer movimiento registrado hasta el periodo actual. Cada periodo incluye el sobrante acumulado que se arrastra al siguiente (`carry_over_out`).

**Query params:** ninguno

**Lógica de periodos:**

Un periodo va desde el `cut_day` de un mes hasta el día anterior al `cut_day` del mes siguiente. Con `cut_day = 24`:

```
Periodo 1:  24 feb → 23 mar
Periodo 2:  24 mar → 23 abr   ← periodo actual (si hoy es 18 abr)
```

**Fórmula por periodo:**

```
total_income   = fixed_income + registered_incomes
balance        = total_income + carry_over_in - expenses
carry_over_out = max(0, balance)   → pasa al siguiente periodo
deficit        = abs(min(0, balance))  → se muestra pero no se arrastra
```

> Si en un periodo los gastos superan el ingreso disponible (incluyendo el carry-over), el déficit se registra en `deficit` pero el `carry_over_out` queda en `0`. El déficit **no se descuenta** del siguiente periodo.

**Request:**
```bash
curl http://localhost:8082/api/v1/balance/periods
```

**Response `200`:**
```json
{
  "data": [
    {
      "period_start": "2026-02-24T00:00:00Z",
      "period_end": "2026-03-23T00:00:00Z",
      "fixed_income": 5000000,
      "registered_incomes": 0,
      "total_income": 5000000,
      "expenses": 3200000,
      "carry_over_in": 0,
      "balance": 1800000,
      "carry_over_out": 1800000,
      "deficit": 0
    },
    {
      "period_start": "2026-03-24T00:00:00Z",
      "period_end": "2026-04-23T00:00:00Z",
      "fixed_income": 5000000,
      "registered_incomes": 250000,
      "total_income": 5250000,
      "expenses": 4100000,
      "carry_over_in": 1800000,
      "balance": 2950000,
      "carry_over_out": 2950000,
      "deficit": 0
    }
  ]
}
```

**Ejemplo con déficit:**
```json
{
  "period_start": "2026-03-24T00:00:00Z",
  "period_end": "2026-04-23T00:00:00Z",
  "fixed_income": 5000000,
  "registered_incomes": 0,
  "total_income": 5000000,
  "expenses": 7500000,
  "carry_over_in": 1800000,
  "balance": -700000,
  "carry_over_out": 0,
  "deficit": 700000
}
```

**Descripción de campos:**

| Campo | Tipo | Descripción |
|---|---|---|
| `period_start` | `string` ISO 8601 | Inicio del periodo (día de corte) |
| `period_end` | `string` ISO 8601 | Último día del periodo (día antes del próximo corte) |
| `fixed_income` | `number` | Ingreso fijo configurado en `income_config.amount` |
| `registered_incomes` | `number` | Suma de movimientos `type='I'` en el periodo |
| `total_income` | `number` | `fixed_income + registered_incomes` |
| `expenses` | `number` | Suma de movimientos `type='E'` en el periodo |
| `carry_over_in` | `number` | Sobrante recibido del periodo anterior |
| `balance` | `number` | `total_income + carry_over_in - expenses` |
| `carry_over_out` | `number` | Sobrante que pasa al siguiente periodo (`0` si `balance < 0`) |
| `deficit` | `number` | Monto del déficit (`0` si `balance >= 0`) |

> **El último elemento del array es siempre el periodo actual.** `carry_over_out` del último periodo es el dinero disponible hoy.

---

## Ingreso fijo

### `GET /incomes/config`

Retorna la configuración actual del ingreso fijo mensual.

**Request:**
```bash
curl http://localhost:8082/api/v1/incomes/config
```

**Response `200`:**
```json
{
  "data": {
    "amount": 5000000,
    "cut_day": 24,
    "description": "Salario",
    "updated_at": "2026-04-01T00:00:00Z"
  }
}
```

---

### `PUT /incomes/config`

Actualiza parcialmente la configuración del ingreso fijo. Solo se actualizan los campos enviados.

**Request body (todos opcionales):**

| Campo | Tipo | Validación | Descripción |
|---|---|---|---|
| `amount` | `number` | `>= 0` | Ingreso fijo mensual en COP |
| `cut_day` | `number` | `1 - 28` | Día de corte del mes |
| `description` | `string` | — | Etiqueta del ingreso |

**Request:**
```bash
curl --location --request PUT 'http://localhost:8082/api/v1/incomes/config' \
--header 'Content-Type: application/json' \
--data '{
  "amount": 6000000,
  "cut_day": 25,
  "description": "Salario + Freelance"
}'
```

**Request (solo actualizar monto):**
```bash
curl --location --request PUT 'http://localhost:8082/api/v1/incomes/config' \
--header 'Content-Type: application/json' \
--data '{
  "amount": 5500000
}'
```

**Response `200`:**
```json
{
  "data": {
    "amount": 6000000,
    "cut_day": 25,
    "description": "Salario + Freelance",
    "updated_at": "2026-04-17T10:00:00Z"
  }
}
```

**Response `400` (validación):**
```json
{
  "error": "cut_day must be between 1 and 28"
}
```

---

## Resumen de endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/categories` | Lista todas las categorías |
| `GET` | `/categories/{id}` | Obtiene una categoría por ID |
| `GET` | `/movements` | Lista movimientos agrupados por categoría |
| `GET` | `/movements/expenses` | Lista gastos plana, orden descendente |
| `GET` | `/movements/summary` | Totales de gastos por mes |
| `GET` | `/movements/{id}` | Obtiene un movimiento por ID |
| `POST` | `/movements` | Crea un movimiento manualmente |
| `PUT` | `/movements/{id}` | Actualiza parcialmente un movimiento |
| `DELETE` | `/movements/{id}` | Elimina un movimiento |
| `GET` | `/balance` | Balance financiero del periodo |
| `GET` | `/incomes/config` | Configuración de ingreso fijo |
| `PUT` | `/incomes/config` | Actualiza configuración de ingreso fijo |
