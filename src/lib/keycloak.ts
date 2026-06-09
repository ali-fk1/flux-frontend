import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8081",
  realm: "Flux",
  clientId: "flux-frontend",
});

/** OAuth redirect_uri must not include hash fragments — Keycloak rejects them. */
export function getRedirectUri(): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

/** Remove leftover OAuth callback params from the URL hash after init. */
export function stripOAuthHashFromUrl(): void {
  const { pathname, search, hash } = window.location;
  if (hash && /(^#|[&#])(code|state|session_state|iss)=/.test(hash)) {
    window.history.replaceState(window.history.state, "", pathname + search);
  }
}

let initPromise: Promise<boolean> | null = null;

/**
 * Singleton Keycloak init — safe under React StrictMode (runs exactly once).
 */
export function initKeycloak(): Promise<boolean> {
  if (!initPromise) {
    initPromise = keycloak
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
        pkceMethod: "S256",
        flow: "standard",
        redirectUri: getRedirectUri(),
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        stripOAuthHashFromUrl();
        return authenticated;
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export function login(): void {
  keycloak.login({ redirectUri: getRedirectUri() });
}

export function logout(): void {
  keycloak.logout({ redirectUri: window.location.origin });
}

export function register(): void {
  keycloak.register({ redirectUri: getRedirectUri() });
}

export default keycloak;
