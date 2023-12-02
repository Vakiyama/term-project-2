import path from "path";
import { readFile, writeFile } from "fs/promises";
import { parseUser } from "../controller";
import { IncomingMessage } from "http";

export type User = {
    id: string,
    description: string,
    username: string,
    stats: Stats,
    profile: string,
    photos: string[],
};

type Stats = {
    posts: number,
    followers: number,
    following: number,
};

const databasePath = path.join(__dirname, "..", "..", "database", "data.json");

export async function getAllUsers() {
    const data = await readFile(databasePath, { encoding: "utf8" });
    const users = JSON.parse(data) as User[];
    return users;
}

export async function addPhotoToUser(request: IncomingMessage, filename: string) {
    if (request.url === undefined) throw new Error("URL is undefined");
    const user = await parseUser(request.url);
    user.photos.push(filename);
    await updateDatabase(user);
}

export async function updateDatabase(user: User) {
    const users = await getAllUsers();
    const index = users.findIndex(foundUser => foundUser.id === user.id);
    users[index] = user;
    await writeFile(databasePath, JSON.stringify(users));
}

export async function getUser(id: string): Promise<User> {
    const users = await getAllUsers();
    const user = users.find(user => user.id === id);
    if (!user) throw new Error("user id not found");
    return user;
}
