import { parse } from "url";
import {
    IncomingMessage,
    ServerResponse,
} from "http";
import { DEFAULT_HEADER } from "./util/util";
import controller from "./controller";
import { 
    createReadStream
} from "fs";
import { pipeline } from "stream";
import { readFile } from "fs/promises";
import path from "path";

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

async function handleImage(request: IncomingMessage, response: ServerResponse) {
    if (request.url === undefined) throw new Error("request url is undefined");
    const imagePath = path.join(__dirname, "public", request.url);
    const mime = getMimeFromPath(imagePath);
    response.writeHead(200, { "Content-Type": mime });
    pipeline(
        createReadStream(imagePath),
        response,
        handleStreamError,
    );
}

function getMimeFromPath(path: string) {
    const splitPath = path.split(".")
    let extension = splitPath[splitPath.length - 1];
    if (extension === "jpg") extension = "jpeg";
    return `image/${extension}`;
}

function handleStreamError(error: Error | null): void {
    if (error) console.log(error);
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

async function handleCss(response: ServerResponse, url: string) {
    const cssPath = path.join(__dirname, "public", url);
    const cssString = await readFile(cssPath, { encoding: "utf8" });
    response.writeHead(200, {
        "Content-Type": "text/css",
    });
    response.end(cssString);
}

function handleError(response: ServerResponse) {
    return (error: Error) => {
        console.log("Something bad has happened", error, error.stack);
        response.writeHead(500, DEFAULT_HEADER);
        response.write(
            JSON.stringify({
                error: "Internal server error",
            })
        );

        return response.end();
    };
}

export default handler;
