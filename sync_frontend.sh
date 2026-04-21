#!/bin/bash

ROOT=$(cd "$(dirname "$0")" && pwd)

# build frontend
function build_frontend() {
    cd $ROOT/frontend
    npm install
    npm run build
}

build_frontend
