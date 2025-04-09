export default ({ config }) => {
  return {
    ...config,
    extra: {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
    },
  };
};
