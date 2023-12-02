import { parse } from "url";
import {
    IncomingMessage,
    ServerResponse,
} from "http";
import { DEFAULT_HEADER } from "./util/util";
import controller from "./controller";
import { createReadStream } from "fs";
import path from "path";
import { 
    handleCss,
    handleImage,
    handleError,
} from "./publicHandlers";

// const __dirname = import.meta.dir

const allRoutes = {
    // GET: localhost:3000/
    "/:get": (request: IncomingMessage, response: ServerResponse) => {
        controller.getHome(request, response);
    },
    // GET: localhost:3000/form
    // POST: localhost:3000/images
    "/images:post": (request: IncomingMessage, response: ServerResponse) => {
        controller.uploadImages(request, response);
    },
    // GET: localhost:3000/feed
    // Shows instagram profile for a given user
    "/profile:get": (request: IncomingMessage, response: ServerResponse) => {
        controller.getProfile(request, response);
    },

    // 404 routes
    default: (request: IncomingMessage, response: ServerResponse) => {
        response.writeHead(404, DEFAULT_HEADER);
        createReadStream(path.join(__dirname, "views", "404.html"), { encoding: "utf8" }).pipe(
            response
        );
    },
};

function extractRequestParameters(request: IncomingMessage) {
    const { url, method } = request;
    if (url === undefined) throw new Error("URL is undefined");
    if (method === undefined) throw new Error("Method is undefined");
    return { url, method };
}

function handler(request: IncomingMessage, response: ServerResponse) {
    const { url, method } = extractRequestParameters(request);
    if (url.match("\.css$")) {
        return Promise.resolve(handleCss(response, url)).catch(handleError(response));
    }

    if (url.match("images/*") && method === "GET") {
        return Promise.resolve(handleImage(request, response)).catch(handleError(response));
    }

    return handleRender(request, response);
}

function handleRender(request: IncomingMessage, response: ServerResponse) {
    const { url, method } = extractRequestParameters(request);

    const { pathname } = parse(url, true);
    let key = `${pathname}:${method.toLowerCase()}` as keyof typeof allRoutes;
    const chosen = allRoutes[key] || allRoutes.default;

    return Promise.resolve(chosen(request, response)).catch(
        handleError(response),
    );
}

export default handler;
