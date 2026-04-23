'use strict';

//todo set environment dynamically... But how?
var environment = 'production';
var isLocalEnvironment = (environment === 'local');

window.bol = {
  version: '3.0.1',
  environment: environment,
  debug: isLocalEnvironment,
  rollbar_access_token: isLocalEnvironment ? 'INVALID_ACCESS_TOKEN' : '4041b43b1d7940c69481d578deeb7704'
};
