let db : Promise<any> | null = null;

export const getDB = async () => {
    if(!db){
        db = null;
    }
    return db;
}


export const initDatabase = async() =>{
    return;
}
