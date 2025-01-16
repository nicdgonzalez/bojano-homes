//! Implementation for the various functions used by the API endpoints.

use std::str::FromStr;

use futures::TryStreamExt;
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use reqwest::StatusCode;
use serde::Deserialize;

use crate::sheets_v4::{self, CreateGetValues, ValueRange};

use super::error::{PropertyError, ReservationError, UserError};
use super::model::{Month, Property, Reservation, User};

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

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct SpreadsheetDocument {
    #[serde(rename = "_id")]
    id: ObjectId,
    property_id: ObjectId,
    year: i32,
}

/// Represents each of the values in a row returned from Google Sheets.
///
/// Table Headings:
/// [0]: Platform
/// [1]: Date Paid Out
/// [2]: Check-in
/// [3]: Check-out
/// [4]: Revenue
/// [5]: Management Fee
/// [6]: Net Profit
#[derive(Deserialize)]
#[rustfmt::skip]
struct ReservationValues(String, String, String, String, String, String, String);

pub async fn get_reservations_by_month(
    property: &Property,
    year: i32,
    month: Month,
    database: &mongodb::Database,
    sheets_client: &mut sheets_v4::Client,
) -> Result<Vec<Reservation>, ReservationError> {
    // property id should already be valid if we got to this point.
    let property_id = ObjectId::from_str(&property.id).unwrap();
    let spreadsheet: SpreadsheetDocument = database
        .collection("spreadsheet")
        .find_one(doc! {"property_id": property_id, "year": year})
        .await
        .map_err(|err| ReservationError::RequestFailure(err.to_string()))?
        .ok_or_else(|| ReservationError::SpreadsheetNotFound(year, property.id.to_string()))?;

    let params = CreateGetValues {
        spreadsheet_id: spreadsheet.id.to_string(),
        range: format!("{month}!A:G"),
    };

    let result: ValueRange<ReservationValues> = sheets_v4::get_values(sheets_client, &params)
        .await
        .map_err(|err| ReservationError::RequestFailure(err.to_string()))?;

    let reservations: Vec<Reservation> = result
        .values
        .iter()
        .filter_map(|values| {
            if values.0.is_empty() {
                return None;
            }

            let management_fee = if values.5.is_empty() {
                0.0
            } else {
                normalize_price(&values.5)
                    .parse()
                    .expect("failed to parse management_fee")
            };

            let reservation = Reservation {
                platform: values.0.to_lowercase(),

                // TODO: Convert these to timestamps
                payout_date: values.1.clone(),
                check_in: values.2.clone(),
                check_out: values.3.clone(),

                revenue: normalize_price(&values.4)
                    .parse()
                    .expect("failed to parse revenue"),
                management_fee,
                net_profit: normalize_price(&values.6)
                    .parse()
                    .expect("failed to parse net profit"),
            };

            Some(reservation)
        })
        .collect();

    Ok(reservations)
}

fn normalize_price(price: &str) -> String {
    price.replace("$", "").replace(",", "")
}
