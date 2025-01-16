//! Implementation for a client to access the Google Sheets v4 API with.

// TODO: Add proper errors and tests. I have also temporarily removed
// helper structs/enums for get_values().

use std::{error, fmt};

use axum::{response::IntoResponse, Json};
use base64::{prelude::BASE64_URL_SAFE_NO_PAD, Engine};
use chrono::Utc;
use openssl::{hash, pkey::PKey, rsa::Rsa, sign::Signer};
use reqwest::StatusCode;
use serde::Deserialize;
use serde_json::json;

pub struct Client {
    credentials: ServiceAccountKey,
    scope: Scope,
    access_token: Option<AccessToken>,
    pub http: reqwest::Client,
}

#[derive(Debug)]
pub enum Scope {
    SpreadsheetsReadOnly,
}

impl fmt::Display for Scope {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        static BASE_URL: &'static str = "https://www.googleapis.com/auth";

        match self {
            Self::SpreadsheetsReadOnly => write!(f, "{BASE_URL}/{}", "spreadsheets.readonly"),
        }
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ServiceAccountKey {
    r#type: String,
    project_id: String,
    private_key_id: String,
    private_key: String,
    client_email: String,
    client_id: String,
    auth_uri: String,
    token_uri: String,
    auth_provider_x509_cert_url: String,
    client_x509_cert_url: String,
    universe_domain: String,
}

impl Client {
    pub fn new(credentials: ServiceAccountKey, scope: Scope) -> Self {
        Self {
            credentials,
            scope,
            access_token: None,
            http: reqwest::Client::new(),
        }
    }

    async fn get_access_token(&mut self) -> Result<String, Box<dyn error::Error>> {
        let access_token_expires_soon = self
            .access_token
            .as_ref()
            .is_some_and(|token| Utc::now().timestamp() >= token.expires_in - (60 * 10));

        if self.access_token.is_none() || access_token_expires_soon {
            self.refresh_access_token().await?;
        }

        let access_token = self.access_token.as_ref().unwrap().access_token.clone();

        Ok(access_token)
    }

    #[must_use]
    async fn refresh_access_token(&mut self) -> Result<(), Box<dyn error::Error>> {
        let client_email = &self.credentials.client_email;
        let private_key = format!("{}\n", self.credentials.private_key);

        // Create the JWT header.
        let header = json!({"alg": "RS256", "typ": "JWT"});
        let mut header_base64 = String::new();
        BASE64_URL_SAFE_NO_PAD.encode_string(
            serde_json::to_string(&header).unwrap().as_bytes(),
            &mut header_base64,
        );

        // Create the JWT claim set.
        let now = chrono::Utc::now().timestamp();
        let claim = JwtClaim {
            iss: client_email.to_string(),
            scope: self.scope.to_string(),
            aud: "https://oauth2.googleapis.com/token".to_string(),
            exp: now + (60 * 5),
            iat: now,
        };

        let mut claim_base64 = String::new();
        BASE64_URL_SAFE_NO_PAD.encode_string(
            serde_json::to_string(&claim).unwrap().as_bytes(),
            &mut claim_base64,
        );

        // Sign the JWT.
        let signing_input = format!("{}.{}", header_base64, claim_base64);
        let rsa = Rsa::private_key_from_pem(private_key.as_bytes()).unwrap();
        let mut signer =
            Signer::new(hash::MessageDigest::sha256(), &PKey::from_rsa(rsa).unwrap()).unwrap();
        signer.update(signing_input.as_bytes()).unwrap();
        let signature = signer.sign_to_vec().unwrap();

        let mut signature_base64 = String::new();
        BASE64_URL_SAFE_NO_PAD.encode_string(&signature, &mut signature_base64);

        // Create the final JWT.
        let jwt = format!("{}.{}.{}", header_base64, claim_base64, signature_base64);

        // Exchange JWT for access token.
        let client = reqwest::Client::new();
        let body = client
            .post(&claim.aud)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(format!(
                "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer\
                &assertion={jwt}"
            ))
            .send()
            .await
            .unwrap()
            .text()
            .await
            .expect("failed to get response body");

        let mut access_token: AccessToken = serde_json::from_str(&body).unwrap();
        access_token.expires_in = chrono::Utc::now().timestamp() + access_token.expires_in;
        self.access_token = Some(access_token);

        Ok(())
    }
}

#[derive(Debug, serde::Serialize)]
/// Contains information about the JSON Web Token (JWT) that it represents.
struct JwtClaim {
    /// (Issuer) Identifies the principal that issued the JWT.
    iss: String,
    /// Permissions that the access token will grant.
    scope: String,
    /// (Audience) The recipient that the JWT is intended for.
    aud: String,
    /// (Expiration time) A Unix timestamp representing when the token expires.
    exp: i64,
    /// (Issued at) A Unix timestamp representing when the token was created.
    iat: i64,
}

#[allow(dead_code)]
#[derive(Debug, serde::Deserialize)]
struct AccessToken {
    pub access_token: String,
    pub expires_in: i64,
    pub token_type: String,
}

pub struct CreateGetValues {
    pub spreadsheet_id: String,
    pub range: String,
}

/// Indicates which dimension an operation should apply to.
#[derive(Debug, Deserialize)]
pub enum Dimension {
    /// Operates on the rows of a sheet.
    Rows,
    /// Operates on the columns of a sheet.
    Columns,
}

#[allow(dead_code)]
#[derive(Debug, serde::Deserialize)]
pub struct ValueRange<T> {
    pub range: String,
    #[serde(rename = "majorDimension")]
    pub major_dimension: Dimension,
    #[serde(bound(deserialize = "T: Deserialize<'de>"))]
    pub values: Vec<T>,
}

#[derive(Debug)]
pub enum GetValuesError {
    RequestFailure(String),
}

impl error::Error for GetValuesError {}

impl fmt::Display for GetValuesError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => write!(f, "{}", reason),
        }
    }
}

impl IntoResponse for GetValuesError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match &self {
            Self::RequestFailure(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let detail = self.to_string();

        (status_code, Json(json!({"detail": detail}))).into_response()
    }
}

pub async fn get_values<T: for<'de> Deserialize<'de>>(
    client: &mut Client,
    params: &CreateGetValues,
) -> Result<ValueRange<T>, GetValuesError> {
    static BASE_URL: &'static str = "https://sheets.googleapis.com/v4/spreadsheets/";

    let url = format!(
        "{BASE_URL}/{id}/values/{range}",
        id = params.spreadsheet_id,
        range = params.range
    );

    let access_token = client
        .get_access_token()
        .await
        .expect("failed to get access token");

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
            _ => GetValuesError::RequestFailure(format!("{:#?}", err.status())),
        })?;

    let body = response.text().await.expect("failed to get response body");
    let data: ValueRange<T> =
        serde_json::from_str(&body).expect("data did not match the expected structure");

    Ok(data)
}
