//! Implementation for the various functions used by the API endpoints.

use std::str::FromStr;

use axum::response::Response;
use chrono::Datelike;
use futures::TryStreamExt;
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use reqwest::StatusCode;
use serde::Deserialize;
use sheets::{self, ValueRange};

use crate::http_error;

use super::error::{ExpenseError, PropertyError, ReservationError, UserError};
use super::model::{Expense, Month, Property, Reservation, User};

#[derive(Debug, serde::Deserialize)]
struct ExpenseSheetDocument {
    #[serde(rename = "_id")]
    id: String,
}

pub async fn get_expense_sheet_id_by_year(
    year: i32,
    database: &mongodb::Database,
) -> Result<String, Response> {
    let document: ExpenseSheetDocument = database
        .collection("expense_sheet")
        .find_one(doc! {"year": year})
        .await
        .map_err(|err| http_error!(StatusCode::INTERNAL_SERVER_ERROR, err.to_string()))?
        .ok_or_else(|| {
            http_error!(
                StatusCode::NOT_FOUND,
                format!("expense sheet not found for year {year}")
            )
        })?;

    Ok(document.id)
}

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

#[derive(Debug, Default, serde::Deserialize)]
struct ExpenseValues(
    String,                     // [0]: Timestamp
    #[allow(dead_code)] String, // [1]: Date
    String,                     // [2]: Property (name)
    String,                     // [3]: Amount
    String,                     // [4]: Description
    #[serde(default)] String,   // [5]: Receipt (link)
    #[serde(default)] String,   // [6]: Merchant
    #[serde(default)] String,   // [7]: Name (of the employee that purchased the item)
);

pub async fn get_expenses_by_year(
    property: &Property,
    year: i32,
    sheets_client: &mut sheets::Client,
    database: &mongodb::Database,
) -> Result<Vec<Expense>, ExpenseError> {
    let expense_sheet_id = get_expense_sheet_id_by_year(year, &database)
        .await
        .map_err(|_| {
            ExpenseError::RequestFailure(format!("failed to get id for {year}'s expense sheet"))
        })?;

    let result: ValueRange<ExpenseValues> =
        sheets::get_values(sheets_client, &expense_sheet_id, "Expenses!A:H")
            .await
            .map_err(|err| ExpenseError::RequestFailure(err.to_string()))?;

    let expenses: Vec<Expense> = result
        .values
        .iter()
        .skip(1) // Skip header row.
        .filter_map(|values| {
            if values.2.to_lowercase() != property.name {
                return None;
            }

            let expense = Expense {
                amount: normalize_price(&values.3)
                    .parse()
                    .expect("failed to parse expense amount"),
                description: values.4.trim().to_string(),
                timestamp: try_parse_timestamp(&values.0).expect("failed to parse timestamp"),
                buyers_name: values.7.trim().to_string(),
                merchant: values.6.trim().to_string(),
                receipt_link: values.5.trim().to_string(),
            };

            Some(expense)
        })
        .collect();

    Ok(expenses)
}

fn try_parse_timestamp(timestamp: &str) -> Option<chrono::NaiveDateTime> {
    static FORMAT: &'static [&str] = &[
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %-H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S.%f%:z",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%Y/%m/%d %-H:%M:%S",
        "%m/%d/%y",
        "%-m/%d/%Y %-H:%M:%S",
    ];

    for &format in FORMAT.iter() {
        match chrono::NaiveDateTime::parse_from_str(timestamp, format) {
            Ok(dt) => return Some(dt),
            Err(err) => println!("{err}"),
        };
    }

    None
}

pub async fn get_expenses_by_month(
    property: &Property,
    year: i32,
    month: u8,
    sheets_client: &mut sheets::Client,
    database: &mongodb::Database,
) -> Result<Vec<Expense>, ExpenseError> {
    Ok(
        get_expenses_by_year(property, year, sheets_client, database)
            .await?
            .into_iter()
            .filter_map(move |expense| {
                (expense.timestamp.month() == (month as u32)).then(|| expense)
            })
            .collect::<Vec<Expense>>(),
    )
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct SpreadsheetDocument {
    #[serde(rename = "_id")]
    id: String,
    property_id: ObjectId,
    year: i32,
}

#[derive(Debug, Deserialize)]
struct ReservationValues(
    String, // [0]: Platform
    String, // [1]: Date Paid Out
    String, // [2]: Check-in
    String, // [3]: Check-out
    String, // [4]: Revenue
    String, // [5]: Management Fee
    String, // [6]: Net Profit
);

pub async fn get_reservations_by_month(
    property: &Property,
    year: i32,
    month: u8,
    database: &mongodb::Database,
    sheets_client: &mut sheets::Client,
) -> Result<Vec<Reservation>, ReservationError> {
    // Property ID should already be valid if we got to this point.
    let property_id = ObjectId::from_str(&property.id).unwrap();
    let spreadsheet: SpreadsheetDocument = database
        .collection("spreadsheet")
        .find_one(doc! {"property_id": property_id, "year": year})
        .await
        .map_err(|err| ReservationError::RequestFailure(err.to_string()))?
        .ok_or_else(|| ReservationError::SpreadsheetNotFound(year, property.id.to_string()))?;

    let month: Month = month
        .try_into()
        .map_err(|_| ReservationError::InvalidMonth)?;

    let result: ValueRange<ReservationValues> =
        sheets::get_values(sheets_client, &spreadsheet.id, &format!("{month}!A:G"))
            .await
            .map_err(|err| ReservationError::RequestFailure(err.to_string()))?;

    let reservations: Vec<Reservation> = result
        .values
        .iter()
        .skip(1) // Skip the table headings.
        .filter_map(|values| {
            if values.0.is_empty() || values.0 == "#REF!" {
                return None;
            }

            let reservation = Reservation {
                platform: values.0.trim().to_lowercase(),
                payout_date: chrono::NaiveDate::parse_from_str(&values.1, "%-m/%-d/%Y")
                    .expect("failed to parse payout date")
                    .into(),
                check_in: chrono::NaiveDate::parse_from_str(&values.2, "%-m/%-d/%Y")
                    .expect("failed to parse check in date")
                    .into(),
                check_out: chrono::NaiveDate::parse_from_str(&values.3, "%-m/%-d/%Y")
                    .expect("failed to parse check out date")
                    .into(),
                revenue: normalize_price(&values.4)
                    .parse()
                    .expect("failed to parse revenue"),
                management_fee: if values.5.is_empty() {
                    0.0
                } else {
                    normalize_price(&values.5)
                        .parse()
                        .expect("failed to parse management_fee")
                },
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
