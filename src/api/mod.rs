//! Implementation for the back end API.

use axum::{
    extract::State,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};

pub fn get_router() -> Router<crate::AppState> {
    Router::new().route("/ping", get(ping))
}

async fn ping(State(state): State<crate::AppState>) -> impl IntoResponse {
    let secret = state
        .secrets
        .get("PING") // Add `PING = 'pong'` to `Secrets.toml`.
        .unwrap_or_else(|| "failed to read secret".to_string());

    let response: Vec<String> = vec![secret];

    Json::from(response)
}
