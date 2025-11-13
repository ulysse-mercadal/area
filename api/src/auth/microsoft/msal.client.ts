import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT || 'common'}`, // 'common' pour multi-tenant
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
};

export const cca = new ConfidentialClientApplication(msalConfig);
