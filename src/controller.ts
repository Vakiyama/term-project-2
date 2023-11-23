import {
    IncomingMessage,
    ServerResponse,
} from "http";
import { promisify } from "util";
import { DEFAULT_HEADER } from "./util/util";
import path from "path";
import { renderFile } from "ejs";
import {
    readFile,
    writeFile,
} from "fs/promises";
import formidable from "formidable";
import { v4 as uuid } from "uuid";

const renderFilePromise = <(filename: string, data?: any) => Promise<string>> promisify(renderFile);
const viewsDir = path.join(__dirname, "views");
const databasePath = path.join(__dirname, "..", "database", "data.json");
const uploadDir = path.join(__dirname, "uploads");

type Stats = {
    posts: number,
    followers: number,
    following: number,
};

type User = {
    id: string,
    description: string,
    username: string,
    stats: Stats,
    profile: string,
    photos: string[],
};

type EjsParams = 
    | User
    | { users: User[] }

const controller = {
    getHome: async (request: IncomingMessage, response: ServerResponse) => {
        const users = await getUsersFromDatabase();
        response.writeHead(200, DEFAULT_HEADER);
        await sendEjs(response, "home", { users });
    },
    getProfile: async (request: IncomingMessage, response: ServerResponse) => {
        if (request.url === undefined) throw new Error("URL is undefined");
        const user = await parseUser(request.url);
        response.writeHead(200, DEFAULT_HEADER);
        await sendEjs(response, "profile", user);
    },
    uploadImages: async (request: IncomingMessage, response: ServerResponse) => {
        const fileName = uuid();
        console.log("upload received");
        const uploadPath = path.join(uploadDir, fileName);
        console.log(uploadPath);
        const form = formidable({});
        console.log("FORMIDABLE");
        form.on('fileBegin', async (formName, file) => {
            console.log("file begin");
            if (!file.mimetype) throw new Error("no mimetype on file upload from client");
            const extension = file.mimetype.split("/")[1];
            if (extension !== "png" && extension !== "jpeg") {
                throw new Error("invalid mime type"); // probably handle this on the client with a invalid filetype response?
            }
            const filename = `${uploadPath}.${extension}`;
            file.filepath = filename;
            console.log(filename, "file begin");
            await addPhotoToUser(request, filename); // TODO: make sure database add behavior works, half implemented 
        });

        form.on('data', ({ name }) => {
            console.log(name);
        });

        form.on('end', () => {
            response.writeHead(302, { location: "/" }); // improve this behavior?
            console.log('-> upload done');
            response.end();
            // await sendEjs(response, "uploadComplete");
        });
        await form.parse(request);
    },
};

async function addPhotoToUser(request: IncomingMessage, filename: string) {
    if (request.url === undefined) throw new Error("URL is undefined");
    console.log(request.url, "URL!!!");
    const user = await parseUser(request.url);
    user.photos.push(filename);
    await updateDatabase(user);
}

async function updateDatabase(user: User) {
    const users = await getUsersFromDatabase();
    const index = users.findIndex(u => u.id === user.id);
    users[index] = user;
    await writeFile(databasePath, JSON.stringify(users));
}

async function parseUser(url: string): Promise<User> {
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const id = queryParams.get("id");
    if (!id) throw new Error("no id field in query");
    return await getUserFromDatabase(id);
}

async function getUsersFromDatabase() {
    const data = await readFile(databasePath, { encoding: "utf8" });
    const users = JSON.parse(data) as User[];
    return users;
}

async function getUserFromDatabase(id: string): Promise<User> {
    const users = await getUsersFromDatabase();
    const user = users.find(user => user.id === id);
    if (!user) throw new Error("user id not found");
    return user;
}

async function sendEjs(response: ServerResponse, filename: string, data?: EjsParams) {
    const filePath = path.join(viewsDir, `${filename}.ejs`);
    const htmlString = await renderFilePromise(filePath, data) as string;
    return response.end(htmlString);
}

export default controller;
