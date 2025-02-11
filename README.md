# Homeowner Dashboard | Bojano Homes

**Homeowner Dashboard** allows access to detailed property information for
Bojano Homes' clients.

This repository contains the source code for the web application, which
utilizes:

- [axum], a web framework for building the back end in Rust.
- [Solid], a web framework for building the front end in JavaScript.
- [Clerk], for user authentication and management.

Click [here](https://bojano-homes-jcml.shuttle.app) for a LIVE demonstration
deployed with [Shuttle].

## 🚀 Getting started

The following steps cover how to set up and run the application locally.

- In order to compile Rust code, you need `cargo`. Follow the installation
  instructions
  [here](https://doc.rust-lang.org/cargo/getting-started/installation.html).

- In order to run the backend server locally, you need to use the Shuttle
  command-line interface. Follow the installation instructions
  [here](https://docs.shuttle.dev/getting-started/installation).

- To compile the client-side code, you'll need `npm`. Follow the installation
  instructions
  [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm?ref=meilisearch-blog).

- Create a file at the root of the project named `Secrets.toml` with the
  following contents (reach out to me if you need help setting the values):

  ```toml
  # To access the Clerk API.
  CLERK_SECRET_KEY = ''

  # To connect to MongoDB (https://www.mongodb.com).
  MONGODB_URI = ''

  # To access Google Sheets.
  SERVICE_ACCOUNT_KEY = '{...}'
  ```

- After everything has been installed and properly configured, you can simply
  run `shuttle run` and everything should take care of itself. The application
  will be available at http://127.0.0.1:8000.

[axum]: https://github.com/tokio-rs/axum
[clerk]: https://clerk.com/
[shuttle]: https://github.com/shuttle-hq/shuttle
[solid]: https://github.com/solidjs/solid
