//! Implementation for the various functions used by the API endpoints.

use std::str::FromStr;

use futures::TryStreamExt;
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use reqwest::StatusCode;
use serde::Deserialize;

use super::error::{PropertyError, UserError};
use super::model::{Property, User};

/// Get information about a user via user ID.
pub async fn get_user_by_id(id: &str, key: &str) -> Result<User, UserError> {
    static BASE_URL: &'static str = "https://api.clerk.com/v1/users";
    let url = format!("{BASE_URL}/{id}");

    let response = reqwest::Client::new()
        .get(url)
        .header("Authorization", format!("Bearer {key}"))
        .send()
        .await
        .map_err(|e| UserError::RequestFailure(e.to_string()))?;

    response
        .error_for_status_ref()
        .map_err(|err| match err.status() {
            Some(StatusCode::BAD_REQUEST) => UserError::BadId(id.to_string()),
            Some(StatusCode::UNAUTHORIZED) => UserError::InvalidApiKey,
            Some(StatusCode::NOT_FOUND) => UserError::NotFound(id.to_string()),
            _ => unreachable!("all status codes should be handled"),
        })?;

    let body = response.text().await.expect("failed to get response body");
    let user: User = serde_json::from_str(&body).expect("expected body to be valid JSON");

    Ok(user)
}

#[derive(Debug, Deserialize)]
struct PropertyDocument {
    #[serde(rename = "_id")]
    id: ObjectId,
    name: String,
}

/// Get all of the properties that belong to the specified user.
pub async fn get_properties_by_user(
    user: &User,
    database: &mongodb::Database,
) -> Result<Vec<Property>, PropertyError> {
    let cursor = database
        .collection("property")
        .find(doc! {"user_id": user.id.to_string()})
        .await
        .map_err(|err| PropertyError::RequestFailure(err.to_string()))?;

    let documents = cursor
        .try_collect::<Vec<PropertyDocument>>()
        .await
        .expect("failed to deserialize property document");

    let properties: Vec<Property> = documents
        .iter()
        .map(|property| Property {
            id: property.id.to_string(),
            name: property.name.to_string(),
            address: None,
        })
        .collect();

    Ok(properties)
}

/// Get information about a property via property ID.
pub async fn get_property_by_id(
    id: &str,
    user: &User,
    database: &mongodb::Database,
) -> Result<Property, PropertyError> {
    let property_id: ObjectId =
        ObjectId::from_str(&id).map_err(|_| PropertyError::BadId(id.to_string()))?;

    let document: PropertyDocument = database
        .collection("property")
        .find_one(doc! {"_id": property_id, "user_id": user.id.to_string()})
        .await
        .map_err(|err| PropertyError::RequestFailure(err.to_string()))?
        .ok_or_else(|| PropertyError::NotFound(id.to_string()))?;

    Ok(Property {
        id: document.id.to_string(),
        name: document.name.to_string(),
        address: None,
    })
}
