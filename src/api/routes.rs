//! Implementation for the API endpoints.

use axum::{
    extract::{Path, State},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use reqwest::StatusCode;
use serde_json::json;

use crate::{
    api::service::get_user_by_id,
    sheets_v4::{self, Scope},
    AppState,
};

use super::{
    model::Month,
    service::{get_properties_by_user, get_property_by_id, get_reservations_by_month},
};

/// Defines all API-related endpoints.
pub fn get_router() -> Router<AppState> {
    Router::new()
        .nest("/expense_sheets", get_router_for_expense_sheets())
        .nest("/users", get_router_for_users())
}

// ┌────────────────────────────────────┐
// │ Implementations for Expense Sheets │
// └────────────────────────────────────┘

fn get_router_for_expense_sheets() -> Router<AppState> {
    Router::new().route("/expense_sheets", get(expense_sheet_get))
}

async fn expense_sheet_get() -> Response {
    todo!()
}

// ┌───────────────────────────┐
// │ Implementations for Users │
// └───────────────────────────┘

fn get_router_for_users() -> Router<AppState> {
    Router::new()
        .route("/", post(user_post))
        .route("/:user_id", get(user_get))
        .nest("/:user_id/properties", get_router_for_properties())
}

async fn user_post() -> Response {
    todo!()
}

async fn user_get(Path(user_id): Path<String>, State(state): State<AppState>) -> Response {
    let secret_key = state
        .secrets
        .get("CLERK_SECRET_KEY")
        .expect("expected CLERK_SECRET_KEY to be defined");

    match get_user_by_id(&user_id, &secret_key).await {
        Ok(user) => Json(user).into_response(),
        Err(err) => err.into_response(),
    }
}

// ┌────────────────────────────────┐
// │ Implementations for Properties │
// └────────────────────────────────┘

fn get_router_for_properties() -> Router<AppState> {
    Router::new()
        .route("/", get(properties_get))
        .route("/:property_id", get(property_get))
        .nest("/:property_id/expenses", get_router_for_expenses())
        .nest("/:property_id/reservations", get_router_for_reservations())
}

async fn properties_get(Path(user_id): Path<String>, State(state): State<AppState>) -> Response {
    let secret_key = state
        .secrets
        .get("CLERK_SECRET_KEY")
        .expect("expected CLERK_SECRET_KEY to be defined");

    let user = match get_user_by_id(&user_id, &secret_key).await {
        Ok(user) => user,
        Err(err) => return err.into_response(),
    };

    match get_properties_by_user(&user, &state.db).await {
        Ok(properties) => Json(properties).into_response(),
        Err(err) => err.into_response(),
    }
}

async fn property_get(
    Path((user_id, property_id)): Path<(String, String)>,
    State(state): State<AppState>,
) -> Response {
    let secret_key = state
        .secrets
        .get("CLERK_SECRET_KEY")
        .expect("expected CLERK_SECRET_KEY to be defined");

    let user = match get_user_by_id(&user_id, &secret_key).await {
        Ok(user) => user,
        Err(err) => return err.into_response(),
    };

    match get_property_by_id(&property_id, &user, &state.db).await {
        Ok(property) => Json(property).into_response(),
        Err(err) => err.into_response(),
    }
}

// ┌──────────────────────────────┐
// │ Implementations for Expenses │
// └──────────────────────────────┘

fn get_router_for_expenses() -> Router<AppState> {
    Router::new()
        .route("/:year", get(expenses_annual_get))
        .route("/:year/:month", get(expenses_monthly_get))
}

async fn expenses_annual_get() -> Response {
    todo!()
}

async fn expenses_monthly_get() -> Response {
    todo!()
}

// ┌──────────────────────────────────┐
// │ Implementations for Reservations │
// └──────────────────────────────────┘

fn get_router_for_reservations() -> Router<AppState> {
    Router::new()
        .route("/:year", get(reservations_annual_get))
        .route("/:year/:month", get(reservations_monthly_get))
}

async fn reservations_annual_get() -> Response {
    todo!()
}

async fn reservations_monthly_get(
    Path((user_id, property_id, year, month)): Path<(String, String, i32, u8)>,
    State(state): State<AppState>,
) -> Response {
    let service_account_key = state
        .secrets
        .get("SERVICE_ACCOUNT_KEY")
        .expect("expected SERVICE_ACCOUNT_KEY to be defined");
    let credentials: sheets_v4::ServiceAccountKey =
        serde_json::from_str(&service_account_key).unwrap();
    let mut sheets_client = sheets_v4::Client::new(credentials, Scope::SpreadsheetsReadOnly);

    let secret_key = state
        .secrets
        .get("CLERK_SECRET_KEY")
        .expect("expected CLERK_SECRET_KEY to be defined");

    let user = match get_user_by_id(&user_id, &secret_key).await {
        Ok(user) => user,
        Err(err) => return err.into_response(),
    };

    let property = match get_property_by_id(&property_id, &user, &state.db).await {
        Ok(property) => property,
        Err(err) => return err.into_response(),
    };

    let month = match month {
        1 => Month::January,
        2 => Month::February,
        3 => Month::March,
        4 => Month::April,
        5 => Month::May,
        6 => Month::June,
        7 => Month::July,
        8 => Month::August,
        9 => Month::September,
        10 => Month::October,
        11 => Month::November,
        12 => Month::December,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"detail": "invalid month digit"})),
            )
                .into_response()
        }
    };

    match get_reservations_by_month(&property, year, month, &state.db, &mut sheets_client).await {
        Ok(reservations) => Json(reservations).into_response(),
        Err(err) => err.into_response(),
    }
}
