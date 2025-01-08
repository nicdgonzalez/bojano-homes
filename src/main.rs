use std::process;

use axum::{
    extract::Request,
    http::{header, HeaderValue},
    middleware,
    response::{Html, IntoResponse},
    Router,
};
use tower::{Layer, ServiceBuilder};
use tower_http::{normalize_path::NormalizePathLayer, services::ServeDir};

/// The main entry point to the program.
#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    unsafe {
        if let Err(why) = dotenvy::EnvLoader::new().load_and_modify() {
            eprintln!("error: failed to load .env file: {why:#?}");
            process::exit(1);
        }
    };

    // Expose the `public` directory.
    let public = ServiceBuilder::new()
        .layer(middleware::from_fn(set_static_cache_control))
        .service(ServeDir::new("./frontend/dist"));

    let router = Router::<()>::new()
        .fallback(|| async { Html(include_str!("../frontend/dist/index.html")) })
        .nest_service("/public", public);

    let router = NormalizePathLayer::trim_trailing_slash().layer(router);
    let router = Router::new().nest_service("/", router);

    Ok(router.into())
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
