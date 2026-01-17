// Sentry configuration for source map upload
// This file is used by @sentry/cli to upload source maps during build

module.exports = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source maps configuration
  include: ['./dist'],
  ignore: ['node_modules'],

  // Release configuration
  release: process.env.SENTRY_RELEASE || `backend@${process.env.npm_package_version}`,

  // Clean up old releases
  cleanArtifacts: true,

  // Verbose logging
  silent: false,
};
