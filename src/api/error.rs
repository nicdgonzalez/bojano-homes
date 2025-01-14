//! Defines the errors returned by the API/service functions.

use std::{error, fmt};

use axum::{response::IntoResponse, Json};
use reqwest::StatusCode;
use serde_json::json;

/// An error occurred while trying to get a user from the database.
#[derive(Debug)]
pub enum UserError {
    /// An unexpected error occurred while trying to get the data.
    RequestFailure(String),
    /// The user ID provided was malformed.
    BadId(String),
    /// The Clerk API key used likely expired.
    InvalidApiKey,
    /// The ID provided was of the correct format, but did not match a user.
    NotFound(String),
}

impl error::Error for UserError {}

impl fmt::Display for UserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => write!(f, "{}", reason),
            Self::BadId(id) => write!(f, "malformed user id: {id}"),
            Self::InvalidApiKey => write!(f, "the api key used was rejected"),
            Self::NotFound(id) => write!(f, "no user with id {id}"),
        }
    }
}

impl IntoResponse for UserError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match &self {
            Self::RequestFailure(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::BadId(_) => StatusCode::BAD_REQUEST,
            Self::InvalidApiKey => StatusCode::INTERNAL_SERVER_ERROR,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
        };
        let detail = self.to_string();

        (status_code, Json(json!({ "detail": detail }))).into_response()
    }
}

/// An error occurred while trying to get properties from the database.
#[derive(Debug)]
pub enum PropertyError {
    /// An unexpected error occurred while trying to get the data.
    RequestFailure(String),
    /// The property ID provided was malformed.
    BadId(String),
    /// The ID provided was of the correct format, but did not match a property.
    NotFound(String),
}

impl error::Error for PropertyError {}

impl fmt::Display for PropertyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => write!(f, "{}", reason),
            Self::BadId(id) => write!(f, "malformed property id: {id}"),
            Self::NotFound(id) => write!(f, "no property with id {id}"),
        }
    }
}

impl IntoResponse for PropertyError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match &self {
            Self::RequestFailure(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::BadId(_) => StatusCode::BAD_REQUEST,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
        };
        let detail = self.to_string();

        (status_code, Json(json!({ "detail": detail }))).into_response()
    }
}
