# Environment And Secrets

- Do not commit `.env*` files or secrets.
- Keep server-only values in unprefixed environment variables.
- Only expose browser-safe values with the framework-specific public prefix documented by the active structure rules.
- Initialize SDK clients lazily inside functions instead of at module scope when they depend on environment variables.
- Document required variables in README or project docs without including real values.
