import { PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    authority:
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_HoVyaFF1T',
    redirectUrl: 'https://main.d36khu890ycgm1.amplifyapp.com/',
    clientId: '4m064arva93fs91cmb2m47pjgj',
    scope: 'email openid phone',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
  },
};
