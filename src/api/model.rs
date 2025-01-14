//! Defines the objects returned by the API.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email_addresses: Vec<EmailAddress>,
    pub phone_numbers: Vec<PhoneNumber>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailAddress {
    pub email_address: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PhoneNumber {
    pub phone_numbers: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Property {
    pub id: String,
    pub name: String,
    pub address: Option<String>,
}
