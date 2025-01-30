use std::{error, fmt};

use reqwest::StatusCode;

use crate::Client;

#[derive(Debug, serde::Deserialize)]
pub struct ValueRange<T> {
    pub range: String,
    #[serde(rename = "majorDimension")]
    pub major_dimension: Dimension,
    #[serde(bound(deserialize = "T: serde::Deserialize<'de>"))]
    pub values: Vec<T>,
}

/// Indicates which dimension an operation should apply to.
#[derive(Debug, serde::Deserialize)]
pub enum Dimension {
    /// Operates on the rows of a sheet.
    #[serde(rename = "ROWS")]
    Rows,
    /// Operates on the columns of a sheet.
    #[serde(rename = "COLUMNS")]
    Columns,
}

pub async fn get_values<T: for<'de> serde::Deserialize<'de>>(
    client: &mut Client,
    spreadsheet_id: &str,
    range: &str,
) -> Result<ValueRange<T>, GetValuesError> {
    static BASE_URL: &'static str = "https://sheets.googleapis.com/v4/spreadsheets";
    let url = format!("{BASE_URL}/{}/values/{}", spreadsheet_id, range);

    let access_token = client
        .get_access_token()
        .await
        .expect("failed to get access_token");

    let response = client
        .http
        .get(url)
        .header("Authorization", format!("Bearer {access_token}"))
        .send()
        .await
        .map_err(|err| GetValuesError::RequestFailure(err.to_string()))?;

    response
        .error_for_status_ref()
        .map_err(|err| match err.status() {
            Some(StatusCode::FORBIDDEN) => GetValuesError::MissingPermissions,
            _ => unreachable!(),
        })?;

    let body = response.text().await.expect("failed to get response body");
    let values: ValueRange<T> = serde_json::from_str(&body).expect("failed to parse response body");
    Ok(values)
}

#[derive(Debug)]
pub enum GetValuesError {
    RequestFailure(String),
    MissingPermissions,
}

impl error::Error for GetValuesError {}

impl fmt::Display for GetValuesError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => {
                write!(f, "failed to get spreadsheet values: {}", reason)
            }
            Self::MissingPermissions => {
                write!(f, "missing required permissions to view this resource")
            }
        }
    }
}

#[cfg(feature = "axum")]
impl axum::response::IntoResponse for GetValuesError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match &self {
            Self::RequestFailure(..) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Self::MissingPermissions => axum::http::StatusCode::FORBIDDEN,
        };
        let detail = self.to_string();

        axum::response::IntoResponse::into_response((
            status_code,
            axum::Json(serde_json::json!({"detail": detail})),
        ))
    }
}
