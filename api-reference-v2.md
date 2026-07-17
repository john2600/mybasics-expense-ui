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
- [Reportes](#reportes)
- [Analytics](#analytics)
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
| `500 Internal Server Error` | Error del servidor (mensaje genérico: `internal server error`) |
| `503 Service Unavailable` | Servicio degradado — usado por `/health` cuando la BD no responde |

> **Errores 500:** el cuerpo siempre es `{"error":"internal server error"}`. El detalle real (mensaje de driver MySQL, query, constraint) se escribe en los logs del servidor y **no** se envía al cliente, para no filtrar información sensible del esquema.

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

### CategoryCreateRequest

```typescript
{
  name:        string   // requerido, no vacío
  description: string   // opcional
  color:       string   // opcional, hex recomendado (ej: "#FF5733")
}
```

### CategoryUpdateRequest

Todos los campos son opcionales. Solo se actualizan los campos enviados.

```typescript
{
  name?:        string
  description?: string
  color?:       string
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

## Health

### `GET /health`

Health check de nivel raíz (fuera de `/api/v1`). Realiza `db.PingContext` con timeout de 3s.

**URL completa:** `http://localhost:8082/health`

**Request:**
```bash
curl -i http://localhost:8082/health
```

**Response 200 — BD saludable:**
```json
{ "status": "ok" }
```

**Response 503 — BD inaccesible:**
```json
{
  "status": "degraded",
  "error": "dial tcp 127.0.0.1:3306: connect: connection refused"
}
```

**Uso típico:** healthcheck de Docker Compose, probe de Kubernetes (`livenessProbe`/`readinessProbe`), o gate de tráfico en un balanceador.

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

### `POST /categories`

Crea una nueva categoría.

**Request body:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | `string` | Sí | Nombre de la categoría |
| `description` | `string` | No | Descripción corta |
| `color` | `string` | No | Color hex (ej: `"#FF5733"`) |

**Request:**
```bash
curl --location --request POST 'http://localhost:8082/api/v1/categories' \
--header 'Content-Type: application/json' \
--data '{
  "name": "Salud",
  "description": "Médico, farmacia y bienestar",
  "color": "#00C853"
}'
```

**Response `201`:**
```json
{
  "data": {
    "id": 8,
    "name": "Salud",
    "description": "Médico, farmacia y bienestar",
    "color": "#00C853",
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T10:00:00Z"
  }
}
```

**Response `400` (validación):**
```json
{
  "error": "name is required"
}
```

---

### `PUT /categories/{id}`

Actualiza parcialmente una categoría. Solo se modifican los campos enviados.

**Path params:**

| Param | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID de la categoría |

**Request body (todos opcionales):**

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nuevo nombre |
| `description` | `string` | Nueva descripción |
| `color` | `string` | Nuevo color hex |

**Request (solo cambiar color):**
```bash
curl --location --request PUT 'http://localhost:8082/api/v1/categories/8' \
--header 'Content-Type: application/json' \
--data '{
  "color": "#76FF03"
}'
```

**Request (actualización múltiple):**
```bash
curl --location --request PUT 'http://localhost:8082/api/v1/categories/8' \
--header 'Content-Type: application/json' \
--data '{
  "name": "Salud & Bienestar",
  "description": "Médico, farmacia, gimnasio",
  "color": "#76FF03"
}'
```

**Response `200`:**
```json
{
  "data": {
    "id": 8,
    "name": "Salud & Bienestar",
    "description": "Médico, farmacia, gimnasio",
    "color": "#76FF03",
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T11:30:00Z"
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

### `DELETE /categories/{id}`

Elimina una categoría por ID.

> **Advertencia:** eliminar una categoría que tenga movimientos asociados puede dejar esos movimientos sin categoría válida. Verificar en el frontend antes de eliminar.

**Path params:**

| Param | Tipo | Descripción |
|---|---|---|
| `id` | `number` | ID de la categoría |

**Request:**
```bash
curl --location --request DELETE 'http://localhost:8082/api/v1/categories/8'
```

**Response `204`:** sin body

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

Retorna el resumen financiero del periodo indicado: total de gastos, ingresos registrados, balance neto, configuración de ingreso fijo y el sobrante del periodo de corte anterior (`carry_over`).

**Query params:**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `date_from` | `YYYY-MM-DD` | No | Fecha inicio (inclusive). Sin valor: sin límite inferior |
| `date_to` | `YYYY-MM-DD` | No | Fecha fin (inclusive). Sin valor: sin límite superior |

**Cálculo del balance y carry-over:**
```
balance    = (income_config.amount + incomes) - expenses
carry_over = max(0, income_config.amount + prev_incomes - prev_expenses)
```

El `carry_over` representa lo que sobró del **periodo de corte anterior**:
- Con `date_from`: el periodo anterior va desde `date_from - 1 mes` hasta `date_from` (excl.)
- Sin fechas: el periodo anterior se calcula automáticamente usando `income_config.cut_day`

Si el periodo anterior tuvo déficit, `carry_over` devuelve `0`.

**Request:**
```bash
# Balance total (sin filtro de fechas — deriva el periodo anterior del cut_day)
curl http://localhost:8082/api/v1/balance

# Balance de abril con carry-over del periodo 24 Feb - 24 Mar
curl "http://localhost:8082/api/v1/balance?date_from=2026-03-24&date_to=2026-04-23"
```

**Response `200`:**
```json
{
  "data": {
    "expenses": 450000,
    "incomes": 0,
    "balance": 4550000,
    "carry_over": 2000000,
    "income_config": {
      "amount": 5000000,
      "cut_day": 24,
      "description": "Salario",
      "updated_at": "2026-04-01T00:00:00Z"
    }
  }
}
```

**Campos del objeto `data`:**

| Campo | Tipo | Descripción |
|---|---|---|
| `expenses` | `number` | Suma de gastos en el rango de fechas |
| `incomes` | `number` | Suma de ingresos registrados en el rango |
| `balance` | `number` | `income_config.amount + incomes - expenses` |
| `carry_over` | `number` | Sobrante del periodo de corte anterior (`0` si hubo déficit) |
| `income_config` | `IncomeConfig` | Configuración de ingreso fijo vigente |

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
| `POST` | `/categories` | Crea una nueva categoría |
| `PUT` | `/categories/{id}` | Actualiza parcialmente una categoría |
| `DELETE` | `/categories/{id}` | Elimina una categoría |
| `GET` | `/movements` | Lista movimientos agrupados por categoría |
| `GET` | `/movements/expenses` | Lista gastos plana, orden descendente |
| `GET` | `/movements/summary` | Totales de gastos por mes |
| `GET` | `/movements/{id}` | Obtiene un movimiento por ID |
| `POST` | `/movements` | Crea un movimiento manualmente |
| `PUT` | `/movements/{id}` | Actualiza parcialmente un movimiento |
| `DELETE` | `/movements/{id}` | Elimina un movimiento |
| `GET` | `/balance` | Balance financiero del periodo |
| `GET` | `/balance/periods` | Historial de periodos con carry-over |
| `GET` | `/incomes/config` | Configuración de ingreso fijo |
| `PUT` | `/incomes/config` | Actualiza configuración de ingreso fijo |

---

## Guía de componentes UI

Sugerencias de componentes visuales y qué endpoints consumen. Ordenados por prioridad para el MVP.

---

### Dashboard principal

**Componente: `BalanceCard`**
Muestra el estado financiero actual del periodo de corte vigente.

- Endpoint: `GET /balance/periods` → último elemento del array
- Campos clave: `balance`, `carry_over_out`, `expenses`, `total_income`, `period_start`, `period_end`
- Variantes visuales:
  - `balance > 0` → color verde, icono positivo
  - `balance < 0` → color rojo, mostrar `deficit`
  - `carry_over_in > 0` → badge "Incluye sobrante anterior: $X"

```
┌─────────────────────────────────┐
│  Periodo: 24 mar → 23 abr       │
│                                 │
│  Disponible          $2.950.000 │
│  ─────────────────────────────  │
│  Ingreso fijo        $5.000.000 │
│  Sobrante anterior   $1.800.000 │
│  Gastos             -$4.100.000 │
│  ─────────────────────────────  │
│  Lleva al siguiente  $2.950.000 │
└─────────────────────────────────┘
```

---

**Componente: `QuickStatsRow`**
Fila de KPIs en el tope del dashboard.

- Endpoint: `GET /balance?date_from=...&date_to=...` (periodo actual)
- Campos: `expenses`, `incomes`, `balance`, `income_config.amount`
- Sugerencia: 3 cards — Gastos del periodo / Ingresos registrados / Balance neto

---

### Gastos

**Componente: `RecentExpensesList`**
Lista de los últimos N gastos con categoría, descripción y monto.

- Endpoint: `GET /movements/expenses?limit=10`
- Campos por fila: `description`, `category`, `amount`, `date`, `hour`
- Acción por fila: botón de re-categorizar → `PUT /movements/{id}`
- Ordenado: más reciente primero (el servidor ya lo garantiza)

---

**Componente: `ExpensesByCategory` (Pie chart / Donut)**
Distribución porcentual de gastos por categoría en un periodo.

- Endpoint: `GET /movements?type=E&date_from=...&date_to=...`
- Transformación: agrupar por `category` y sumar `total` de cada grupo
- La respuesta ya viene agrupada — usar `category` y `total` directamente
- Color por categoría: usar `category.color` de `GET /categories`

```
Alimentacion  ████████  42%  $1.800.000
Transporte    ████      21%  $900.000
Entretenimiento ██      11%  $450.000
Otros         ████      26%  $1.100.000
```

---

**Componente: `MonthlyExpensesChart` (Bar chart)**
Tendencia de gastos mes a mes.

- Endpoint: `GET /movements/summary`
- Eje X: `month/year` (construir label con `year` y `month`)
- Eje Y: `total`
- Útil para detectar meses atípicos

---

**Componente: `ExpenseFilterBar`**
Barra de filtros para `RecentExpensesList` y `ExpensesByCategory`.

- Params que maneja: `date_from`, `date_to`, `category_id`
- Fuente de categorías: `GET /categories` al montar el componente
- Al cambiar filtros: re-fetch de `GET /movements/expenses` y `GET /movements`

---

### Periodos y carry-over

**Componente: `PeriodsTimeline`**
Vista histórica de todos los periodos de corte con carry-over encadenado.

- Endpoint: `GET /balance/periods`
- Una fila por periodo con: fechas, ingresos, gastos, sobrante
- Resaltar el periodo actual (último elemento)
- Indicador visual de carry-over entre periodos (flecha o línea conectora)
- Si `deficit > 0`: fila en rojo con badge "Déficit"

```
Feb 24 – Mar 23   Ingresos $5.0M   Gastos $3.2M   Sobrante → $1.8M
Mar 24 – Abr 23   Ingresos $5.2M   Gastos $4.1M   + $1.8M  → $2.9M  ← actual
```

---

**Componente: `CarryOverIndicator`**
Badge o chip que muestra cuánto carry-over viene del periodo anterior.

- Dato: `carry_over_in` del último elemento de `GET /balance/periods`
- Mostrar solo si `carry_over_in > 0`
- Ejemplo: "Llevas $1.800.000 del periodo anterior"

---

### Categorías

**Componente: `CategoryManager`**
Pantalla o sección de administración de categorías: listar, crear, editar y eliminar.

- Listar: `GET /categories` al montar
- Crear: `POST /categories` → refetch de `GET /categories`
- Editar: `PUT /categories/{id}` → actualizar item en lista local
- Eliminar: `DELETE /categories/{id}` con diálogo de confirmación → refetch de `GET /categories`
- Tras eliminar: advertir al usuario si la categoría tiene movimientos asociados

```
┌─────────────────────────────────────────┐
│  Categorías                    [+ Nueva] │
│─────────────────────────────────────────│
│  ● Alimentacion   Gastos de comida  ✏ 🗑 │
│  ● Transporte     Uber, taxi        ✏ 🗑 │
│  ● Salud          Médico, farmacia  ✏ 🗑 │
└─────────────────────────────────────────┘
```

- El color de cada fila (●) viene del campo `color` de la categoría
- Al hacer clic en ✏: formulario inline o modal con `CategoryUpdateRequest`
- Al hacer clic en 🗑: modal de confirmación antes de `DELETE /categories/{id}`
- Validaciones en cliente: `name` no vacío; `color` debe ser hex válido si se ingresa

---

### Configuración

**Componente: `IncomeConfigForm`**
Formulario para editar el ingreso fijo y el día de corte.

- GET inicial: `GET /incomes/config`
- Al guardar: `PUT /incomes/config`
- Validaciones en cliente:
  - `amount >= 0`
  - `cut_day` entre `1` y `28`
- Tras guardar exitoso: refetch de `GET /balance/periods` (el carry-over cambia)

---

### Movimientos

**Componente: `MovementForm`**
Formulario para crear un movimiento manualmente.

- POST: `POST /movements`
- Selector de categoría: `GET /categories` al montar
- Campos: `description`, `amount`, `date`, `category_id`, `type`, `hour` (opcional)
- Default de `type`: `"E"` (gasto)

---

**Componente: `MovementDetailDrawer`**
Panel lateral o modal con detalle de un movimiento y opción de editar categoría.

- GET: `GET /movements/{id}`
- Re-categorizar: `PUT /movements/{id}` con solo `{ "category_id": X }`
- Eliminar: `DELETE /movements/{id}` con confirmación

---

### Estrategia de fetching recomendada

| Componente | Cuándo hacer fetch | Refetch |
|---|---|---|
| `BalanceCard` | Al montar la página | Al cambiar `incomes/config` |
| `RecentExpensesList` | Al montar / cambiar filtros | Al crear o eliminar movimiento |
| `ExpensesByCategory` | Al montar / cambiar filtros | Al crear o re-categorizar |
| `MonthlyExpensesChart` | Al montar | Al crear o eliminar movimiento |
| `PeriodsTimeline` | Al montar | Al cambiar `incomes/config` |
| `IncomeConfigForm` | Al abrir la pantalla de config | — |
| `CategoryManager` | Al montar la pantalla de config | Al crear, editar o eliminar categoría |
| `SpendingOverviewCard` | Al montar el dashboard | Al cambiar filtro de meses |
| `CategoryDonutChart` | Al montar el dashboard | Al cambiar filtro de meses |
| `SpendingTrendChart` | Al montar el dashboard | Al cambiar filtro de meses |
| `TopExpensesTable` | Al montar el dashboard | Al cambiar filtro de meses o límite |
| `IncomeVsExpenseChart` | Al montar el dashboard | Al cambiar filtro de meses |

---

## Reportes

Exportación del historial de gastos en múltiples formatos.

### Resumen de endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/reports/export` | Exporta gastos en JSON, CSV o PDF |

---

### GET /reports/export

Devuelve los gastos del período seleccionado en el formato solicitado.

**Query parameters**

| Parámetro | Tipo | Default | Restricciones | Descripción |
|---|---|---|---|---|
| `format` | `string` | `json` | `json` \| `csv` \| `pdf` | Formato de salida |
| `months` | `number` | `3` | `1`–`12` | Meses hacia atrás a incluir |

**Formato JSON — Response 200** `Content-Type: application/json`

```json
{
  "data": {
    "period_from": "2026-03-01",
    "period_to": "2026-05-31",
    "total": 4820.75,
    "monthly_summary": [
      { "year": 2026, "month": 3, "label": "Mar 2026", "total": 1850.50 },
      { "year": 2026, "month": 4, "label": "Abr 2026", "total": 1430.25 },
      { "year": 2026, "month": 5, "label": "May 2026", "total": 1540.00 }
    ],
    "expenses": [
      {
        "id": 42,
        "date": "2026-05-20",
        "category": "Food & Dining",
        "description": "Supermercado semanal",
        "amount": 185.00
      }
    ]
  }
}
```

**Formato CSV — Response 200** `Content-Type: text/csv`
Header: `Content-Disposition: attachment; filename="expenses_2026-03_2026-05.csv"`

```
id,date,category,description,amount
42,2026-05-20,Food & Dining,Supermercado semanal,185.00
...

# Resumen mensual
month,total
Mar 2026,1850.50
Abr 2026,1430.25
May 2026,1540.00

# Total
4820.75
```

**Formato PDF — Response 200** `Content-Type: application/pdf`
Header: `Content-Disposition: attachment; filename="expenses_2026-03_2026-05.pdf"`
Devuelve bytes de un PDF con tabla de detalle de gastos y resumen mensual.

**Errores**

| Código | Causa |
|---|---|
| `400` | `format` inválido o `months` fuera de rango |

### Modelos — Reportes

#### ExportReport

```typescript
{
  period_from:      string            // fecha inicio YYYY-MM-DD
  period_to:        string            // fecha fin YYYY-MM-DD
  total:            number            // suma total del período
  monthly_summary:  ReportMonthlySummary[]
  expenses:         ExportRow[]
}
```

#### ReportMonthlySummary

```typescript
{
  year:  number  // año
  month: number  // mes 1-12
  label: string  // etiqueta legible, ej: "Mar 2026"
  total: number  // suma de gastos del mes
}
```

#### ExportRow

```typescript
{
  id:          number  // id del movimiento
  date:        string  // YYYY-MM-DD
  category:    string  // nombre de la categoría
  description: string  // descripción del movimiento
  amount:      number  // monto en COP
}
```

---

## Analytics

Análisis y patrones sobre el historial de gastos. Todos los endpoints aceptan `?months=1-12` (default `3`). Sin dependencias externas — SQL puro.

### Resumen de endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/analytics/summary` | Resumen ejecutivo del período |
| `GET` | `/analytics/by-category` | Gasto por categoría con % del total |
| `GET` | `/analytics/trend` | Evolución mensual del gasto |
| `GET` | `/analytics/top-expenses` | Top N gastos individuales |
| `GET` | `/analytics/income-vs-expense` | Comparativa ingresos vs egresos |

**Query parameter común**

| Parámetro | Tipo | Default | Restricciones |
|---|---|---|---|
| `months` | `number` | `3` | `1`–`12` |

---

### GET /analytics/summary

Resumen ejecutivo: total gastado, promedio mensual y mes con mayor gasto.

**Response 200**

```json
{
  "data": {
    "period_from": "2026-03-01",
    "period_to": "2026-05-31",
    "months": 3,
    "total_spent": 4820.75,
    "monthly_average": 1606.92,
    "peak_month": {
      "year": 2026, "month": 3, "label": "Mar 2026", "total": 1850.50
    },
    "expense_count": 34
  }
}
```

---

### GET /analytics/by-category

Desglose del gasto por categoría, ordenado de mayor a menor, con porcentaje sobre el total del período.

**Response 200**

```json
{
  "data": {
    "period_from": "2026-03-01",
    "period_to": "2026-05-31",
    "total_spent": 4820.75,
    "categories": [
      {
        "category_id": 3,
        "category": "Housing",
        "total": 3600.00,
        "percentage": 74.68,
        "count": 3
      }
    ]
  }
}
```

---

### GET /analytics/trend

Evolución mensual del gasto — datos listos para graficar en línea o barras.

**Response 200**

```json
{
  "data": {
    "period_from": "2026-03-01",
    "period_to": "2026-05-31",
    "points": [
      { "year": 2026, "month": 3, "label": "Mar 2026", "total": 1850.50, "count": 12 },
      { "year": 2026, "month": 4, "label": "Abr 2026", "total": 1430.25, "count": 10 },
      { "year": 2026, "month": 5, "label": "May 2026", "total": 1540.00, "count": 12 }
    ]
  }
}
```

---

### GET /analytics/top-expenses

Los N gastos individuales más altos del período.

**Query parameters adicionales**

| Parámetro | Tipo | Default | Restricciones |
|---|---|---|---|
| `limit` | `number` | `10` | `1`–`50` |

**Response 200**

```json
{
  "data": {
    "period_from": "2026-03-01",
    "period_to": "2026-05-31",
    "expenses": [
      {
        "id": 5,
        "date": "2026-03-01",
        "category": "Housing",
        "description": "Renta mensual",
        "amount": 1200.00
      }
    ]
  }
}
```

---

### GET /analytics/income-vs-expense

Comparativa mensual de ingresos vs egresos con balance neto por mes y totales del período.

**Response 200**

```json
{
  "data": {
    "period_from": "2026-03-01",
    "period_to": "2026-05-31",
    "months": [
      {
        "year": 2026, "month": 3, "label": "Mar 2026",
        "income": 3500.00, "expense": 1850.50, "balance": 1649.50
      },
      {
        "year": 2026, "month": 4, "label": "Abr 2026",
        "income": 3500.00, "expense": 1430.25, "balance": 2069.75
      },
      {
        "year": 2026, "month": 5, "label": "May 2026",
        "income": 3500.00, "expense": 1540.00, "balance": 1960.00
      }
    ],
    "totals": {
      "income": 10500.00,
      "expense": 4820.75,
      "balance": 5679.25
    }
  }
}
```

### Modelos — Analytics

#### AnalyticsSummary

```typescript
{
  period_from:     string     // YYYY-MM-DD
  period_to:       string     // YYYY-MM-DD
  months:          number     // ventana solicitada
  total_spent:     number
  monthly_average: number
  peak_month:      PeakMonth
  expense_count:   number
}
```

#### PeakMonth

```typescript
{
  year:  number
  month: number
  label: string  // ej: "Mar 2026"
  total: number
}
```

#### ByCategory

```typescript
{
  period_from:  string
  period_to:    string
  total_spent:  number
  categories:   CategoryBreakdown[]
}
```

#### CategoryBreakdown

```typescript
{
  category_id: number
  category:    string
  total:       number
  percentage:  number  // 0-100, 2 decimales
  count:       number
}
```

#### Trend

```typescript
{
  period_from: string
  period_to:   string
  points:      TrendPoint[]
}
```

#### TrendPoint

```typescript
{
  year:  number
  month: number
  label: string
  total: number
  count: number
}
```

#### TopExpenses

```typescript
{
  period_from: string
  period_to:   string
  expenses:    TopExpense[]
}
```

#### TopExpense

```typescript
{
  id:          number
  date:        string  // YYYY-MM-DD
  category:    string
  description: string
  amount:      number
}
```

#### IncomeVsExpense

```typescript
{
  period_from: string
  period_to:   string
  months:      MonthIVE[]
  totals:      Totals
}
```

#### MonthIVE

```typescript
{
  year:    number
  month:   number
  label:   string
  income:  number
  expense: number
  balance: number  // income - expense
}
```

#### Totals

```typescript
{
  income:  number
  expense: number
  balance: number
}
