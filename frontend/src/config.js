const config = {
    development: {
      apiUrl: 'http://localhost:3001'
    },
    production: {
      apiUrl: import.meta.env.VITE_API_URL || 'https://your-api-url.com'
    }
  };
  
  const environment = import.meta.env.MODE || 'development';
  export default config[environment];