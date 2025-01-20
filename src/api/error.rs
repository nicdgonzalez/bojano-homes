//! Defines the errors returned by the API/service functions.

use std::{error, fmt};

use axum::response::IntoResponse;
use reqwest::StatusCode;

use crate::http_error;

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
            Self::RequestFailure(..) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::BadId(..) => StatusCode::BAD_REQUEST,
            Self::InvalidApiKey => StatusCode::INTERNAL_SERVER_ERROR,
            Self::NotFound(..) => StatusCode::NOT_FOUND,
        };
        let detail = self.to_string();

        http_error!(status_code, detail)
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
            Self::RequestFailure(..) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::BadId(..) => StatusCode::BAD_REQUEST,
            Self::NotFound(..) => StatusCode::NOT_FOUND,
        };
        let detail = self.to_string();

        http_error!(status_code, detail)
    }
}

#[derive(Debug)]
pub enum ExpenseError {
    /// An unexpected error occurred while trying to get the data.
    RequestFailure(String),
}

impl error::Error for ExpenseError {}

impl fmt::Display for ExpenseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => write!(f, "{}", reason),
        }
    }
}

impl IntoResponse for ExpenseError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match &self {
            Self::RequestFailure(..) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let detail = self.to_string();

        http_error!(status_code, detail)
    }
}

/// An error occurred while trying to get reservations from the database.
#[derive(Debug)]
pub enum ReservationError {
    /// An unexpected error occurred while trying to get the data.
    RequestFailure(String),
    /// A property exists, but the corresponding data sheet was not found.
    SpreadsheetNotFound(i32, String),
    /// An invalid value was provided for month.
    InvalidMonth,
}

impl error::Error for ReservationError {}

impl fmt::Display for ReservationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => write!(f, "{}", reason),
            Self::SpreadsheetNotFound(year, id) => write!(
                f,
                "year {} spreadsheet not found for property with id {}",
                year, id
            ),
            Self::InvalidMonth => write!(f, "invalid value provided for month"),
        }
    }
}

impl IntoResponse for ReservationError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match &self {
            Self::RequestFailure(..) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::SpreadsheetNotFound(..) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::InvalidMonth => StatusCode::BAD_REQUEST,
        };
        let detail = self.to_string();

        http_error!(status_code, detail)
    }
}
