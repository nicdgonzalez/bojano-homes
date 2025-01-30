use std::{error, fmt};

use base64::prelude::*;
use openssl::{hash, pkey, rsa, sign};
use serde_json::json;

use crate::Client;

#[derive(Debug, serde::Deserialize)]
pub struct AccessToken {
    #[serde(rename = "access_token")]
    pub value: String,
    #[serde(rename = "expires_in")]
    pub expires_at: i64,
}

/// Request a new access token from the Google API.
#[must_use]
pub async fn refresh_access_token(client: &Client) -> Result<AccessToken, RefreshAccessTokenError> {
    let client_email = &client.credentials.client_email;
    let private_key = format!("{}\n", client.credentials.private_key);

    let header = get_jwt_header();
    let claim = get_jwt_claim(&client_email, &client.scope.to_string());
    let signature = get_signature(&private_key, &header, &claim);

    let jwt = format!("{}.{}.{}", header, claim, signature);

    let access_token = request_access_token(&client, &jwt).await?;
    Ok(access_token)
}

fn get_jwt_header() -> String {
    let input = {
        let header = json!({"alg": "RS256", "typ": "JWT"});
        serde_json::to_string(&header).unwrap()
    };

    // Convert header into a Base64 encoded string.
    let mut buffer = String::new();
    BASE64_URL_SAFE_NO_PAD.encode_string(input.as_bytes(), &mut buffer);
    buffer
}

fn get_jwt_claim(iss: &str, scope: &str) -> String {
    let input = {
        let now = chrono::Utc::now().timestamp();
        let claim = json!({
            "iss": iss.to_string(),
            "scope": scope.to_string(),
            "aud": "https://oauth2.googleapis.com/token".to_string(),
            "exp": now + (60 * 5), // Expires in 5 minutes.
            "iat": now,
        });
        serde_json::to_string(&claim).unwrap()
    };

    // Convert claim into a Base64 encoded string.
    let mut buffer = String::new();
    BASE64_URL_SAFE_NO_PAD.encode_string(input.as_bytes(), &mut buffer);
    buffer
}

fn get_signature(private_key: &str, header: &str, claim: &str) -> String {
    let input = {
        let rsa = rsa::Rsa::private_key_from_pem(private_key.as_bytes()).unwrap();
        let pkey = pkey::PKey::from_rsa(rsa).unwrap();
        let mut signer = sign::Signer::new(hash::MessageDigest::sha256(), &pkey).unwrap();

        let data = format!("{}.{}", header, claim);
        signer.update(data.as_bytes()).unwrap();

        signer.sign_to_vec().unwrap()
    };

    // Convert signature into a Base64 encoded string.
    let mut buffer = String::new();
    BASE64_URL_SAFE_NO_PAD.encode_string(&input, &mut buffer);
    buffer
}

async fn request_access_token(
    client: &Client,
    jwt: &str,
) -> Result<AccessToken, RefreshAccessTokenError> {
    let body = format!(
        "grant_type={}&assertion={}",
        "urn:ietf:params:oauth:grant-type:jwt-bearer", jwt,
    );

    let response = client
        .http
        .post("https://oauth2.googleapis.com/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|err| RefreshAccessTokenError::RequestFailure(err.to_string()))?
        .text()
        .await
        .expect("failed to get response body");

    let mut access_token: AccessToken = serde_json::from_str(&response).unwrap();
    // Without knowing when the response was received, the duration until
    // the token expires is meaningless; instead of duration, use timestamp.
    access_token.expires_at = chrono::Utc::now().timestamp() + access_token.expires_at;
    Ok(access_token)
}

/// Represents an error that occurred while trying to create an access token.
#[derive(Debug)]
pub enum RefreshAccessTokenError {
    /// An error occurred while trying to request a new access token.
    RequestFailure(String),
}

impl error::Error for RefreshAccessTokenError {}

impl fmt::Display for RefreshAccessTokenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::RequestFailure(reason) => write!(
                f,
                "an error occurred while getting access token: {}",
                reason
            ),
        }
    }
}
