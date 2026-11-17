use std::str::FromStr;

use sqlx::SqlitePool;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use tokio::sync::OnceCell;

static DB: OnceCell<SqlitePool> = OnceCell::const_new();

pub async fn db() -> Result<&'static SqlitePool, String> {
    DB.get_or_try_init(|| async {
        let url = std::env::var("LEARN_AI_DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:///workspace/learnai.db".to_string());
        let options = SqliteConnectOptions::from_str(&url)
            .map_err(|error| error.to_string())?
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await
            .map_err(|error| error.to_string())?;
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|error| error.to_string())?;
        Ok(pool)
    })
    .await
}
