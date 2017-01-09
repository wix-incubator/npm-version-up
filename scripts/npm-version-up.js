#!/usr/bin/env node
const prepareForRelease = require('../index').prepareForRelease;
const shouldShrinkWrap = process.argv.indexOf("--no-shrinkwrap") < 0;

try {
  prepareForRelease({shouldShrinkWrap});
} catch (err) {
  console.log(err);
  process.exit(1);
}
