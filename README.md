# Blockade - API

This README would normally document whatever steps are necessary to get you application up and running

## Getting Started

- Install Dependencies - `npm install`
- Build Project - `npm run build`
- Start Project - `npm start`

Project should start with default configuration

## Testing

N/A

## Serving

- For serving local server - `npm run serve`
- For serving local server with compilation - `npm run serve -- --forceBuildOnWatch`

## Linting

- For JS files via `eslint` - `npm run lint`
- FOR Markdown files via `remarkjs` - `npm run lint-md`

## Syncing Locales

```bash
gulp sync_locales --option=value
```

**Configration**

- Provide key value pairs via
`--option=value` when invoking. Config provided here are given highest priority.
- Provide key value pairs at `.syncrc` file.

- `localeSyncDir` `String`/`[String]` `REQUIRED` - Directory where sync info will be stored. If path multiple levels, provide `[String]` for each level.
- `localesDir` `String`/`[String]` `REQUIRED`
- Directory from where locales will be loaded. If path multiple levels, provide `[String]` for each level.
- `localeBase` `String` `REQUIRED` - Locales tag acting as a base.
- `localeTarget` `String` `REQUIRED` - Locale tag acting as a target.
-  `tag` `String` `REQUIRED` - Sync version tagging.

**Notes**

- Make sure that the configured target directory for sync routine already exists.
- Before moving on to a new version, invoke the sync routine for the updated version.
This step is essential as it will initialize the lock file for tracking further changes.

**Sync File**

- At the end of the routine, `targetDir/tag.json` will be generated.
- `diff` contains the new entries which are needed for translation.
- `map` contains the paths for `diff` entries.


## Configuration

The module uses [config](https://www.npmjs.com/package/config) for loading configuration entries.

In the `config` directory:

- Consult/update
`custom-environment-variables.json` for loading values via environment. This overrides any value set in files defined below.
- Create `local.json` for local config.
- Consult/update `development.json` for values at development. (The default env)
- Consult/update `testing.json` for values at testing. `NODE_CONFIG_ENV` must be set to `testing` for this.
- Consult/Update `staging.json` for values at staging. `NODE_CONFIF_ENV` must be set to `staging` for this.
- Consult/Update `production.json` for values at production. `NODE_CONFIG_ENV` must be set to `production` for this.
- Consult/update `default.json` for **constant values only**. Define entries here which will remain same across deployments.

**INFO** `local*` files allow you to manually provide config during development and are set not to be tracked by VCS. Any environment can be overridden locally via:

- `local.json` - Overrides everything.
- `local-{env}.json` Overrides only specific `env` environment.

**INFO:** Read more about in what order the config entries are loaded [here](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-load-order).

**Entries:**

Each entry here is an object notation and is provided with short description.
- `app.tempDir` `String` - Directory used for storing temporary files app wide. App can automatically take care of initialization of the provided value here. (Default: `tmp`)
- `app.locale` `String` - Language code for default locale to use when none could be resolved automatically. (Default: `en`)
- `logger.console` `Boolean/String` - Set this to `true` for registering `Console` transport for logging. (Default: `true`)
- `papertrail.host` `String` - If provided, logging via [Papertrail](https://papertrail.com) will be enabled.
- `papertrail.port` `String` - If provided, logging via [Papertrail](https://papertrail.com) will be enabled.
- `papertrail.program` `String` - Papertrail program. Useful for prefixing log messages with custom namespace.
- `papertrail.handleExceptions` `Boolean` - For enabling logging of un-handled exceptions via papertrail. (Default: `false`)
- `sentry.dsn` `String` - Sentry DSN for error reporting. If not provided, sentry will not be configured.
- `sentry.env` `String` - Environment for Sentry. [More Info](https://docs.sentry.io/learn/environments/?platform=node)
- `www.port` `Number/String` - Port for listening incoming HTTP connection. (Default: `8080`)
- `infura.endpoint` `String` - Endpoint to use for using [Infura API](https://infura.io). `{projectId}` wildcard can be used to replace with configured project ID.
- `infura.projectId` `String` `REQUIRED` - Project ID on [Infura API](https://infura.io)