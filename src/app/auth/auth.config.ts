import { PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    authority:
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtizp7Sp2',
    redirectUrl: 'https://main.d1dbozfv7qh8jl.amplifyapp.com/',
    clientId: '4j9pa1oamff1bd4hk3181rq4vp',
    scope: 'email openid phone',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
  },
};
