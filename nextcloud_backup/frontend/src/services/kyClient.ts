import ky from "ky";

const kyClient = ky.create({
  prefixUrl: "http://localhost:3000/v2/api",
});

export default kyClient;
