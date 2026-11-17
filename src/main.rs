mod app;
mod app_actions;
mod components;
mod domain;
mod platform;
mod server;
mod state;

fn main() {
    #[cfg(feature = "server")]
    {
        dioxus::serve(|| async move {
            use dioxus::server::axum::routing::get;

            async fn health() -> &'static str {
                "{\"status\":\"ok\"}"
            }

            let router = dioxus::server::router(app::App)
                .route("/health", get(health))
                .route("/api/health", get(health));
            Ok(router)
        });
    }

    #[cfg(not(feature = "server"))]
    {
        dioxus::launch(app::App);
    }
}
