const BASE_URLS = {
  local: "http://127.0.0.1:8000/api",
  deploy: "https://akbarekaputra01-nostressia-backend.hf.space/api",
};

const ENV = import.meta.env.VITE_API_ENV || "local";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || BASE_URLS[ENV] || BASE_URLS.deploy;
