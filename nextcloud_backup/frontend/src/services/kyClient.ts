import ky from "ky";
const kyClient = ky.create({
  prefixUrl: `${import.meta.env.VITE_API_URL}v2/api`,
});

export default kyClient;
