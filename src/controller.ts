import {
    IncomingMessage,
    ServerResponse,
} from "http";
import { promisify } from "util";
import { DEFAULT_HEADER } from "./util/util";
import path from "path";
import { renderFile } from "ejs";
import { 
    getAllUsers,
    getUser,
    addPhotoToUser,
    User,
} from "./scripts/databaseHelpers";
import formidable from "formidable";
import { v4 as uuid } from "uuid";

const renderFilePromise = <(filename: string, data?: any) => Promise<string>> promisify(renderFile);
const viewsDir = path.join(__dirname, "views");
const uploadDir = path.join(__dirname, "public", "images");

type EjsParams = User | { users: User[] }

const controller = {
    getHome: async (request: IncomingMessage, response: ServerResponse) => {
        const users = await getAllUsers();
        response.writeHead(200, DEFAULT_HEADER);
        await sendEjs(response, "home", { users });
    },
    getProfile: async (request: IncomingMessage, response: ServerResponse) => {
        if (request.url === undefined) throw new Error("URL is undefined");
        const user = await parseUser(request.url);
        response.writeHead(200, DEFAULT_HEADER);
        await sendEjs(response, "profile", user);
    },
    uploadImages: handleImageUpload,
};

async function handleImageUpload(request: IncomingMessage, response: ServerResponse) {
    const fileID = uuid();
    const uploadPath = path.join(uploadDir, fileID);
    const form = formidable({});
    form.on('fileBegin', async (formName, file) => {
        if (!file.mimetype) throw new Error("no mimetype on file upload from client");
        const extension = file.mimetype.split("/")[1];
        if (extension !== "png" && extension !== "jpeg") {
            throw new Error("invalid mime type");
        }
        const filePath = `${uploadPath}.${extension}`;
        file.filepath = filePath ;
        await addPhotoToUser(request, `${fileID}.${extension}`); 
    });
    form.on('end', () => {
        response.writeHead(302, { location: "/" }); // improve this behavior?
        response.end();
    });
    await form.parse(request);
};

export async function parseUser(url: string): Promise<User> {
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const id = queryParams.get("id");
    if (!id) throw new Error("no id field in query");
    return await getUser(id);
}

async function sendEjs(response: ServerResponse, filename: string, data?: EjsParams) {
    const filePath = path.join(viewsDir, `${filename}.ejs`);
    const htmlString = await renderFilePromise(filePath, data) as string;
    return response.end(htmlString);
}

export default controller;
