const BASE_URLS = {
  local: "http://127.0.0.1:8000",
  deploy: "https://akbarekaputra01-nostressia-backend.hf.space",
};

const isProduction = import.meta.env.PROD;
const baseUrl = isProduction ? BASE_URLS.deploy : BASE_URLS.local;
export const BASE_URL = `${baseUrl}/api`;
