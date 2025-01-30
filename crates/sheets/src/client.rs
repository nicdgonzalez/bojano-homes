use std::error;

use crate::access_token::{refresh_access_token, AccessToken};
use crate::credentials::ServiceAccountKey;
use crate::scopes::Scope;

/// Represents the HTTP client that will be interacting with the Google API.
pub struct Client {
    pub http: reqwest::Client,
    pub credentials: ServiceAccountKey,
    pub scope: Scope,
    access_token: Option<AccessToken>,
}

impl Client {
    pub fn new(credentials: ServiceAccountKey, scope: Scope) -> Self {
        Self {
            http: reqwest::Client::new(),
            credentials,
            scope,
            access_token: None,
        }
    }

    pub async fn get_access_token(&mut self) -> Result<String, Box<dyn error::Error>> {
        let access_token_expires_soon = self.access_token.as_ref().is_some_and(|token| {
            let now = chrono::Utc::now().timestamp();
            // `60 * n` converts `n` minutes into seconds. If `n` is 10,
            // we are checking if the token expires within the next 10 minutes.
            now >= (token.expires_at - (60 * 10))
        });

        if self.access_token.is_none() || access_token_expires_soon {
            let access_token = refresh_access_token(&self).await?;
            self.access_token = Some(access_token);
        }

        Ok(self.access_token.as_ref().unwrap().value.clone())
    }
}
