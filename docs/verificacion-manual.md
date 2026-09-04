# Verificación manual antes de subir cambios

Checklist para levantar la app a mano y comprobar que funciona **antes** de
hacer `git push`. No hay tests automáticos en el proyecto, así que este recorrido
es la única red de seguridad.

Tiempo aproximado: 5 minutos.

---

## 0. Requisitos

- Node y npm instalados (`node -v` — probado con v24).
- El API de [`mybasics-expenses`](../../mybasics-expenses) corriendo, con su MySQL.
- Dependencias del front instaladas:

```bash
npm install
```

---

## 1. Averiguar en qué puerto está el API **con autenticación**

Este paso no es opcional. El README del backend dice que el API local corre en
`8080` y el de Docker Compose en `8081`, pero puede haber varias instancias
levantadas a la vez y **no todas tienen autenticación por token**. Si apuntas a
la equivocada, el login devolverá 404 y los endpoints protegidos responderán 200
sin token, lo que enmascara cualquier fallo de sesión.

Sonda los puertos candidatos:

```bash
for p in 8080 8081 8082; do
  printf "puerto %s -> health: " $p
  curl -s -m 2 -o /dev/null -w "%{http_code}" "http://localhost:$p/health"
  printf "  login: "
  curl -s -m 2 -o /dev/null -w "%{http_code}" -X POST "http://localhost:$p/api/v1/tokens/authentication" \
    -H "Content-Type: application/json" -d '{}'
  printf "  protegido sin token: "
  curl -s -m 2 -o /dev/null -w "%{http_code}\n" "http://localhost:$p/api/v1/incomes/config"
done
```

El puerto bueno es el que responde:

| Sonda                            | Valor esperado    |
|----------------------------------|-------------------|
| `/health`                        | `200`             |
| `/api/v1/tokens/authentication`  | `400` (no `404`)  |
| protegido sin token              | `401` (no `200`)  |

> Un `404` en `/tokens/authentication` significa que esa instancia es anterior a
> la autenticación por token. Un `200` en el endpoint protegido, que no tiene auth
> ninguna. Descártala en ambos casos.

---

## 2. Configurar el entorno

```bash
cp .env.example .env
```

Ajusta `VITE_API_PROXY_TARGET` al puerto que encontraste en el paso 1:

```
VITE_API_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost:8082
```

Deja `VITE_API_URL` **relativa** para que la sirva el proxy de Vite
(`vite.config.ts`). Con autenticación por token el proxy ya no es
imprescindible — no se envían cookies, así que el `Access-Control-Allow-Origin: *`
del API basta y su preflight ya admite la cabecera `Authorization` — pero
mantenerlo evita depender de cómo esté configurado el CORS del backend.

> Lo que **no** debes hacer es reintroducir `credentials: 'include'` en
> `src/services/api.ts`. Esa opción combinada con `Allow-Origin: *` hace que el
> navegador descarte la respuesta, y con curl no se reproduce porque curl ignora
> CORS. El token va en la cabecera, no en cookies.

---

## 3. Levantar la app

```bash
npm run dev
```

Queda en http://localhost:5173.

Comprueba que el proxy está enrutando bien antes de abrir el navegador:

```bash
curl -s -o /dev/null -w "login vía proxy: HTTP %{http_code}\n" \
  -X POST http://localhost:5173/api/v1/tokens/authentication \
  -H "Content-Type: application/json" -d '{"email":"x@y.com","password":"nopevalid"}'
```

Debe responder `HTTP 401`. Si devuelve `404`, el proxy no está activo, el destino
es incorrecto, o esa instancia no tiene autenticación por token.

---

## 4. Recorrido en el navegador

Abre http://localhost:5173 y ejecuta esta secuencia. Los usuarios se crean de
verdad en la base de datos, así que usa un email nuevo cada vez (o reutiliza uno
ya creado y salta el registro).

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir la app sin sesión | Sale la pantalla **Iniciar sesión**, no el dashboard |
| 2 | Pulsar **Crear cuenta** | Formulario con usuario, nombre, email y contraseña |
| 3 | Enviar con contraseña de 7 caracteres | `password debe tener al menos 8 caracteres` |
| 4 | Enviar con un email sin `@` | `email inválido` |
| 5 | Registrar un usuario nuevo válido | Vuelve al login con el **email precargado** y aviso verde |
| 6 | Repetir el registro con el mismo email | `username or email already in use` |
| 7 | Login con contraseña incorrecta | `invalid email or password`, se queda en el login |
| 8 | Login correcto | Entra al dashboard; arriba a la derecha aparece el email |
| 9 | Recargar la página (F5) | Sigue dentro, no vuelve al login |
| 10 | Pulsar **Salir** | Botón pasa a "Saliendo…" y vuelve al login |
| 11 | Recargar tras salir | Sigue fuera |

Con la sesión abierta (paso 8), verifica en la consola del navegador que el token
está guardado y que se envía en la cabecera:

```js
const s = JSON.parse(localStorage.getItem('mybasics.auth'));
s.token && s.expiry                    // token de 24 h — es la credencial, no una pista
document.cookie.includes('session')    // false — el esquema de cookie quedó deprecado
await fetch('/api/v1/incomes/config', { headers: { Authorization: `Bearer ${s.token}` } })
  .then(r => r.status)                 // 200
```

En la pestaña **Network**, cualquier petición a `/api/v1/...` debe llevar
`Authorization: Bearer …`. Si alguna sale sin ella, es que se está llamando fuera
de `request` (`src/services/api.ts`), que es quien la añade.

Guarda ese `s.token` antes de salir y, después del paso 10, comprueba que el
servidor lo revocó de verdad:

```js
await fetch('/api/v1/incomes/config', { headers: { Authorization: `Bearer ${TOKEN_ANTERIOR}` } })
  .then(r => r.status)                 // 401
```

> Esto importa: `POST /tokens/logout` borra **todos** los tokens del usuario, así
> que cierra la sesión en todos sus dispositivos. Si el token viejo sigue dando
> `200`, el logout solo limpió el estado local y es un fallo real, no cosmético.

Revisa además que la consola no tenga errores. Los mensajes de Vite y el aviso de
React DevTools son normales.

---

## 5. Comprobaciones de código

```bash
npm test            # Vitest: debe terminar en "Tests  N passed"
npx tsc -b          # sin salida = correcto
npm run build       # debe terminar en "✓ built in ..."
```

El aviso de `chunks are larger than 500 kB` es preexistente y no bloquea.

> **No uses `tsc --noEmit`.** El `tsconfig.json` raíz es de tipo solución
> (`"files": []` y solo referencias), así que ese comando no comprueba ningún
> fichero y **siempre pasa**. Da una sensación falsa de seguridad: `tsc -b` sí
> compila los proyectos referenciados.

> `npm run lint` **está roto** en el repo: falta `eslint.config.js` y ESLint 9 lo
> exige. Falla igual sin tus cambios, así que no lo tomes como señal.

---

## 6. Revisar el diff antes de subir

```bash
git status --short
git diff
```

Antes del push, confirma que:

- [ ] No se cuela el `.env` (tiene tu configuración local; está en `.gitignore`).
- [ ] No quedan `console.log` de depuración.
- [ ] No hay credenciales ni emails reales en el código ni en los mockups.
- [ ] Si tocaste `src/services/authApi.ts` o `api.ts`, repetiste el paso 4
      completo: son el camino crítico de la sesión.
- [ ] Si añadiste un endpoint **público** nuevo, está en `PUBLIC_PATHS`
      (`src/services/api.ts`); si no, su `401` cerrará la sesión del usuario.

Y sube:

```bash
git push johndev <tu-rama>
```

---

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| El login no hace nada y en la consola sale un error de CORS | `VITE_API_URL` quedó absoluta, o alguien reintrodujo `credentials: 'include'` |
| `HTTP 404` al hacer login vía proxy | `VITE_API_PROXY_TARGET` apunta a una instancia anterior a los tokens |
| Entras al dashboard pero todo sale en `$ 0` | Normal en una cuenta nueva: aún no hay movimientos |
| Te echa al login al recargar, con sesión reciente | El token caducó (duran 24 h) o lo revocó un logout desde otro dispositivo |
| Todas las peticiones dan `401` nada más entrar | El token no se está adjuntando: revisa que `AuthProvider` llame a `setAuthToken` |
| Sigues dentro tras pulsar Salir y recargar | El `POST /tokens/logout` falló; mira la pestaña Network |
| Cambiaste `.env` y no surte efecto | Vite lee el `.env` al arrancar: reinicia `npm run dev` |
