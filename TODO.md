# TO DO

- [x] Use Shuttle's [SecretStore] instead of a `.env` file.
- [ ] Fix Vite not utilizing the path aliases in `tsconfig.json`.
- [ ] Find out if `serde` would let me flatten `User::email_addresses`
  and `User::phone_numbers` into `Vec<String>`s. Otherwise I have to convert
  all fields manually from the raw data; in that case, it would just be easier
  to leave it the way it is with object containing a single field.

[secretstore]: https://docs.shuttle.dev/resources/shuttle-secrets
