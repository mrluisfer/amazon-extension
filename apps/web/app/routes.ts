import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('privacidad', 'routes/privacy.tsx'),
  route('terminos', 'routes/terms.tsx'),
] satisfies RouteConfig;
