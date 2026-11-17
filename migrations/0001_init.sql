CREATE TABLE IF NOT EXISTS mindmaps (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    document JSON NOT NULL,
    schema_version INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
