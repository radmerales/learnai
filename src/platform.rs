#[cfg(feature = "web")]
const LAST_MAP_KEY: &str = "learnai.lastMindmapId";

#[cfg(feature = "web")]
pub fn remembered_id() -> Option<String> {
    use gloo_storage::{LocalStorage, Storage};
    LocalStorage::get(LAST_MAP_KEY).ok()
}

#[cfg(not(feature = "web"))]
pub fn remembered_id() -> Option<String> {
    None
}

#[cfg(feature = "web")]
pub fn remember_id(id: Option<String>) {
    use gloo_storage::{LocalStorage, Storage};
    match id {
        Some(id) => {
            let _ = LocalStorage::set(LAST_MAP_KEY, id);
        }
        None => LocalStorage::delete(LAST_MAP_KEY),
    }
}

#[cfg(not(feature = "web"))]
pub fn remember_id(_id: Option<String>) {}

/// Browser viewport size, used to keep fixed-position menus on screen.
#[cfg(feature = "web")]
pub fn viewport_size() -> (f64, f64) {
    web_sys::window()
        .map(|window| {
            let width = window
                .inner_width()
                .ok()
                .and_then(|value| value.as_f64())
                .unwrap_or(1024.0);
            let height = window
                .inner_height()
                .ok()
                .and_then(|value| value.as_f64())
                .unwrap_or(768.0);
            (width, height)
        })
        .unwrap_or((1024.0, 768.0))
}

#[cfg(not(feature = "web"))]
pub fn viewport_size() -> (f64, f64) {
    (1024.0, 768.0)
}

#[cfg(feature = "web")]
pub fn confirm(message: &str) -> bool {
    web_sys::window()
        .and_then(|window| window.confirm_with_message(message).ok())
        .unwrap_or(false)
}

#[cfg(not(feature = "web"))]
pub fn confirm(_message: &str) -> bool {
    true
}

#[cfg(feature = "web")]
pub async fn sleep_ms(ms: u64) {
    gloo_timers::future::TimeoutFuture::new(ms as u32).await;
}

#[cfg(all(feature = "server", not(feature = "web")))]
pub async fn sleep_ms(ms: u64) {
    tokio::time::sleep(std::time::Duration::from_millis(ms)).await;
}

#[cfg(not(any(feature = "web", feature = "server")))]
pub async fn sleep_ms(_ms: u64) {}
