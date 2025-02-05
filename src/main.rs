mod api;

use axum::{
    extract::{FromRef, Request},
    http::{header, HeaderValue},
    middleware,
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use mongodb::bson::doc;
use shuttle_runtime::SecretStore;
use tower::{Layer, ServiceBuilder};
use tower_http::{normalize_path::NormalizePathLayer, services::ServeDir};

#[derive(Clone, FromRef)]
struct AppState {
    secrets: SecretStore,
    db: mongodb::Database,
}

/// The main entry point to the program.
#[shuttle_runtime::main]
async fn main(#[shuttle_runtime::Secrets] secrets: SecretStore) -> shuttle_axum::ShuttleAxum {
    // Expose the `public` directory.
    let public = ServiceBuilder::new()
        .layer(middleware::from_fn(set_static_cache_control))
        // The contents of our local `public` directory are automatically
        // copied into the `dist` directory by Vite when building the frontend.
        .service(ServeDir::new("./frontend/dist"));

    let database_uri = secrets
        .get("MONGODB_URI")
        .expect("expected 'MONGODB_URI' to be defined");
    let client = mongodb::Client::with_uri_str(&database_uri)
        .await
        .expect("failed to connect to mongodb");
    let db = client.database("LAB");

    db.run_command(doc! {"ping": 1})
        .await
        .expect("failed to ping the database");

    let state = AppState { secrets, db };

    let router = Router::<AppState>::new()
        .route("/", get(serve_frontend))
        .nest("/api", api::get_router())
        .nest_service("/public", public)
        .with_state(state.into());

    // Technically, `/foo` and `/foo/` are different routes; returning an error
    // if one is not defined makes sense, but is counter intuitive for users.
    // The following makes it so both routes load the same content.
    //
    // Because routing occurs before any middleware is ran, we need to wrap
    // the original router with the following normalization layer. This cannot
    // be added as a layer to the original router or it will not work.
    let router = NormalizePathLayer::trim_trailing_slash().layer(router);

    // And finally, because Shuttle expects the final layer to be a Router
    // (not `NormalizePathLayer`), we nest the normalization layer into a
    // new router and return that instead.
    let router = Router::new().nest_service("/", router);

    Ok(router.into())
}

async fn serve_frontend() -> impl IntoResponse {
    Html(include_str!("../frontend/dist/index.html"))
}

async fn set_static_cache_control(request: Request, next: middleware::Next) -> impl IntoResponse {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=0"),
    );

    response
}

macro_rules! http_error {
    ($status_code:expr, $detail:expr) => {
        axum::response::IntoResponse::into_response(($status_code, axum::Json(serde_json::json!({"detail": $detail}))))
    };
}

pub(crate) use http_error;
