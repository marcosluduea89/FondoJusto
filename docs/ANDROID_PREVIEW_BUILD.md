# Android Preview Build

Esta guia deja una APK instalable para compartir por fuera de Play Store.

## Validaciones locales

```bash
npm test
npm run typecheck
npx expo install --check
npx expo-doctor
```

## Variables de entorno

La app necesita estas variables:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Para builds en EAS Cloud, configurarlas en:

```text
Expo dashboard -> Project -> Environment variables
```

Tambien se pueden cargar con EAS CLI:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "..." --environment preview
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..." --environment preview
```

No commitear `.env`.

## Build APK Preview

```bash
npx eas-cli build --platform android --profile preview
```

El perfil `preview` genera APK:

```json
{
  "android": {
    "buildType": "apk"
  },
  "distribution": "internal"
}
```

## Instalacion

Cuando EAS termina, entrega un link de descarga. Descargar la APK en Android y permitir instalacion desde fuente externa si el sistema lo pide.

## Antes de compartir

- Probar registro/login.
- Probar confirmacion de email y deep link `fondojusto://auth/callback`.
- Probar crear hogar, generar codigo e invitar segundo usuario.
- Probar ingreso/gasto/ajustes desde dos celulares.
- Confirmar que el estado de sync queda en `Sincronizado`.
