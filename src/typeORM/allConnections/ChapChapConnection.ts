import {getConnectionOptions, createConnection} from "typeorm";

export const createChapChapConnection = async() => {
    const connectionOptions = await getConnectionOptions(process.env.NODE_ENV + "ChapChap");
    console.log("environnment de " + process.env.NODE_ENV + " sur Chap Chap");
    console.log("database is " + connectionOptions.database)
    return createConnection({
        ...connectionOptions,
        name: "default"
    });
}