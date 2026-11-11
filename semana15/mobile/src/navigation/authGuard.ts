// Equivalente de features/auth/ui/auth_guard.dart (GetMiddleware): todas las
// rutas con nombre menos la central exigen sesión; el visitante sólo puede
// entrar a /home.
import { getContainer } from "../core/di/DIProvider";
import { TOKENS } from "../core/di/tokens";
import { NamedRoute, RouteNames } from "../core/navigation/routes";
import { AuthenticationController } from "../features/auth/ui/viewmodels/authenticationController";

export function authGuard(route: NamedRoute): NamedRoute {
  if (route === RouteNames.central) return route;
  const auth = getContainer().resolve<AuthenticationController>(TOKENS.AuthenticationController);
  if (auth.isLogged || auth.isRestoring) return route;
  if (auth.isGuest && route === RouteNames.home) return route;
  return RouteNames.central;
}
