import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { getCognitoConfig } from "@/lib/cognito";

type IdTokenPayload = {
  sub?: string;
  name?: string;
  email?: string;
  "cognito:groups"?: string[] | string;
  "custom:role"?: string;
  "custom:major"?: string;
  "custom:birthYear"?: string;
  "custom:majorSubjectId"?: string;
};

export function getUserPool() {
  const config = getCognitoConfig();
  return new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });
}

export function getCurrentUser() {
  return getUserPool().getCurrentUser();
}

export function buildCognitoUser(email: string) {
  return new CognitoUser({
    Username: email,
    Pool: getUserPool(),
  });
}

export function buildAuthDetails(email: string, password: string) {
  return new AuthenticationDetails({
    Username: email,
    Password: password,
  });
}

export function buildSignupAttributes(input: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  major?: string;
  birthYear?: number;
  majorSubjectId?: string;
}) {
  const attributes: CognitoUserAttribute[] = [
    new CognitoUserAttribute({ Name: "name", Value: input.name }),
    new CognitoUserAttribute({ Name: "email", Value: input.email }),
    new CognitoUserAttribute({ Name: "custom:role", Value: input.role }),
  ];
  if (input.phone) attributes.push(new CognitoUserAttribute({ Name: "phone_number", Value: input.phone }));
  if (input.major) attributes.push(new CognitoUserAttribute({ Name: "custom:major", Value: input.major }));
  if (input.birthYear)
    attributes.push(new CognitoUserAttribute({ Name: "custom:birthYear", Value: String(input.birthYear) }));
  if (input.majorSubjectId)
    attributes.push(new CognitoUserAttribute({ Name: "custom:majorSubjectId", Value: input.majorSubjectId }));
  return attributes;
}

export function parseIdToken(token?: string | null): IdTokenPayload | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodeURIComponent(escape(json))) as IdTokenPayload;
}
