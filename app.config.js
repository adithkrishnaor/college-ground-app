export default ({ config }) => {
  return {
    ...config,
    extra: {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      eas: {
        projectId: "6b99890c-6e85-46fe-948a-e6064b18248d",
      },
    },
  };
};
