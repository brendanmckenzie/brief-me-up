#!/usr/bin/env bash
set -ex

pushd infra

terraform plan -out tfplan
terraform apply tfplan

popd
