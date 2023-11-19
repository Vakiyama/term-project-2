import { parse } from "url";
import http from "http";
import { DEFAULT_HEADER } from "./util/util";
import controller from "./controller";
import { createReadStream } from "fs";
import path from "path";

const __dirname = import.meta.dir

const allRoutes = {
  // GET: localhost:3000/form
  "/form:get": (request: http.IncomingMessage, response: http.ServerResponse) => {
    controller.getFormPage(request, response);
  },
  // POST: localhost:3000/form
  "/form:post": (request: http.IncomingMessage, response: http.ServerResponse) => {
    controller.sendFormData(request, response);
  },
  // POST: localhost:3000/images
  "/images:post": (request: http.IncomingMessage, response: http.ServerResponse) => {
    controller.uploadImages(request, response);
  },
  // GET: localhost:3000/feed
  // Shows instagram profile for a given user
  "/feed:get": (request: http.IncomingMessage, response: http.ServerResponse) => {
    controller.getFeed(request, response);
  },

  // 404 routes
  default: (request: http.IncomingMessage, response: http.ServerResponse) => {
    response.writeHead(404, DEFAULT_HEADER);
    createReadStream(path.join(__dirname, "views", "404.html"), "utf8").pipe(
      response
    );
  },
};

function handler(request: http.IncomingMessage, response: http.ServerResponse) {
  const { url, method } = request;

  if (url === undefined) throw new Error("URL is undefined");
  if (method === undefined) throw new Error("Method is undefined");
  const { pathname } = parse(url, true);

  let key = `${pathname}:${method.toLowerCase()}` as keyof typeof allRoutes;
  const chosen = allRoutes[key] || allRoutes.default;

  return Promise.resolve(chosen(request, response)).catch(
    handlerError(response),
  );
}

function handlerError(response) {
  return (error: Error) => {
    console.log("Something bad has happened", error.stack);
    response.writeHead(500, DEFAULT_HEADER);
    response.write(
      JSON.stringify({
        error: "Internal server error",
      })
    );

    return response.end();
  };
}

module.exports = handler;
