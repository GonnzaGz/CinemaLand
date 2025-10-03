import { PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    authority:
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_3HspZNy7e',
    redirectUrl: 'https://main.d229d9k3wl7093.amplifyapp.com/',
    clientId: '1v91jckl7411lmtn3r1k0m664p',
    scope: 'email openid phone',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
  },
};
