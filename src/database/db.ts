type SQLiteDB = {
    execAsync: (sql: string) => Promise<void>;
    getAllAsync: <T>(sql: string, params?: any[]) => Promise<T[]>;
    runAsync: (sql: string, params?: any[]) => Promise<any>;
    withTransactionAsync: (work: (tx: any) => Promise<void>) => Promise<void>;
};

let db : Promise<SQLiteDB> | null = null;

export const getDB = async () => {
    if(!db){
        try {
            const mod = await import('expo-sqlite');
            const database = await mod.openDatabaseAsync('productivityApp.db');
            db = Promise.resolve(database as unknown as SQLiteDB);
        } catch (e) {
            console.error('Failed to open database:', e);
            db = null;
        }
    }
    return db;
}


export const initDatabase = async() =>{
    const database = await getDB();
    if (!database) return;

    await database.execAsync(`
        pragma foreign_keys = on;

        create table if not exists sections(
            id text primary key not null,
            name text not null,
            iconName text,
            sortOrder integer not null
        );

        create table if not exists events(
        id text primary key not null,
        section_id text,
        title text not null,
        type text not null,
        priority text not null,
        status text not null,
        start_time text not null,
        end_time text,
        remark text,
        created_at text not null,
        updated_at text not null,
        foreign key(section_id) references sections(id) on delete set null
    );

    create table if not exists notes(
        id text primary key not null,
        section_id text,
        title text not null,
        label text not null default 'General',
        line_count integer not null default 0,
        created_at text not null,
        updated_at text not null,
        foreign key(section_id) references sections(id) on delete set null
    );

    CREATE TABLE IF NOT EXISTS note_contents (
      id TEXT PRIMARY KEY NOT NULL,
      note_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      block_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    INSERT OR IGNORE INTO sections (id, name, iconName, sortOrder) VALUES 
      ('sec_academic', 'Academic', 'school', 1),
      ('sec_projects', 'Projects', 'folder', 2),
      ('sec_personal', 'Personal', 'person', 3);
  `);
    
}
