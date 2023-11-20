import http from "http";
import handler from "./handler";

const PORT = process.env.PORT || 7111;

http
  .createServer(handler)
  .listen(PORT, () => console.log(`server is running at ${PORT}`));
