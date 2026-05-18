# Supabase Auth Redirect

FondoJusto usa un deep link propio para que los emails de confirmacion vuelvan a la app movil:

```text
fondojusto://auth/callback
```

## App

`app.json` registra el scheme:

```json
{
  "expo": {
    "scheme": "fondojusto"
  }
}
```

`AuthContext` envia el redirect al crear usuarios con Supabase:

```ts
options: {
  emailRedirectTo: "fondojusto://auth/callback"
}
```

## Supabase Dashboard

En Supabase:

```text
Authentication -> URL Configuration
```

Configurar:

```text
Site URL: fondojusto://auth/callback
Redirect URLs:
fondojusto://auth/callback
fondojusto://**
```

`fondojusto://**` permite mantener margen para otros callbacks moviles futuros, como reset de password.

## Email Templates

Si el email sigue redirigiendo a `localhost:3000`, revisar:

```text
Authentication -> Email Templates -> Confirm signup
```

La plantilla debe usar el redirect enviado por la app. Supabase recomienda usar `{{ .RedirectTo }}` en vez de depender de `{{ .SiteURL }}` cuando se envia `emailRedirectTo`.

Ejemplo:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirmar cuenta
</a>
```

Si se mantiene la plantilla default de Supabase y respeta `RedirectTo`, no hace falta cambiarla.

## Desarrollo

El deep link `fondojusto://...` esta pensado para development builds y builds instaladas. En Expo Go puede no comportarse igual que una app instalada con su propio scheme.
