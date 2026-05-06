# FondoJusto

App movil Android para gestion financiera familiar de pareja.

## Stack

- React Native + Expo
- TypeScript
- AsyncStorage para persistencia local inicial
- Arquitectura preparada para reemplazar el repositorio local por Google Sheets / Google Drive

## Estructura

```text
src/
  components/   UI reutilizable
  hooks/        Estado global y acceso a datos
  models/       Entidades TypeScript del dominio
  navigation/   Navegacion principal
  screens/      Pantallas del MVP
  services/     Reglas de negocio puras
  storage/      Persistencia local y datos demo
  theme/        Colores compartidos
  utils/        Formato, fechas e ids
```

## Scripts

```bash
npm install
npm run android
npm run typecheck
```

## Nota

El MVP funciona offline con datos locales. Para una segunda etapa, implementar otro `AppRepository`
con el mismo contrato usado por `src/storage/localRepository.ts`.
