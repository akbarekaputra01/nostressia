const BASE_URLS = {
  local: "http://127.0.0.1:8000/api",
  deploy: "https://akbarekaputra01-nostressia-backend.hf.space/api",
};

const isProduction = import.meta.env.PROD;
export const BASE_URL = isProduction ? BASE_URLS.deploy : BASE_URLS.local;