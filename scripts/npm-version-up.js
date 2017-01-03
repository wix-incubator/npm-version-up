#!/usr/bin/env node
const shouldShrinkWrap = process.argv.indexOf("--no-shrinkwrap") < 0;

require('../index').prepareForRelease({shouldShrinkWrap: shouldShrinkWrap}, err => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
});
