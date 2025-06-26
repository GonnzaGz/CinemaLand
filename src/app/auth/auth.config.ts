import { PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    authority:
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_nJtvOvWqE',
    redirectUrl: 'https://main.d1uzt1m5adsnqs.amplifyapp.com/',
    clientId: '105ok41eluof37gu84a4m7dd3',
    scope: 'email openid phone',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
  },
};
