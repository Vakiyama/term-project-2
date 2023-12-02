import {
    IncomingMessage,
    ServerResponse,
} from "http";
import { pipeline } from "stream";
import { readFile } from "fs/promises";
import { DEFAULT_HEADER } from "./util/util";
import path from "path";
import { createReadStream } from "fs";


export async function handleImage(request: IncomingMessage, response: ServerResponse) {
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

export async function handleCss(response: ServerResponse, url: string) {
    const cssPath = path.join(__dirname, "public", url);
    const cssString = await readFile(cssPath, { encoding: "utf8" });
    response.writeHead(200, {
        "Content-Type": "text/css",
    });
    response.end(cssString);
}

export function handleError(response: ServerResponse) {
    return (error: Error) => {
        console.log("Internal server error: ", error, error.stack);
        response.writeHead(500, DEFAULT_HEADER);
        response.write(
            JSON.stringify({
                error: "Internal server error",
            })
        );

        return response.end();
    };
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
