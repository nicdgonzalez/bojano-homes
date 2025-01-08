#!/usr/bin/bash

# An experimental hook to install custom build dependencies.
# https://docs.shuttle.dev/docs/builds#experimental-hook-scripts

apt-get update && apt-get install -y nodejs npm
