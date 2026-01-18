type CognitoConfig = {
  region: string;
  userPoolId: string;
  clientId: string;
  domain?: string;
};

export function getCognitoConfig(): CognitoConfig {
  return {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "ap-northeast-2",
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "ap-northeast-2_OeN8sOrlc",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "4uqo2rr8r2nb1e89bfdcue23ba",
    domain:
      process.env.NEXT_PUBLIC_COGNITO_DOMAIN ??
      "https://ap-northeast-2oen8sorlc.auth.ap-northeast-2.amazoncognito.com",
  };
}

export function getCognitoAuthority(config: CognitoConfig): string {
  return `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`;
}

export function getCognitoLogoutUrl(config: CognitoConfig, logoutUri: string): string {
  if (!config.domain) return logoutUri;
  return `${config.domain}/logout?client_id=${config.clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}
