set -ex

rm -rf dist/

yarn
echo "compiling typescript"
yarn run tsc

echo "copying resources"
cp -r res dist/

echo "preparing build directory"
rm -rf build/
mkdir build/
mkdir build/nodejs/

echo "zipping lambda function"
pushd dist
zip -r ../build/function.zip .
popd

echo "preparing node_modules layer"
cp -r node_modules build/nodejs/node_modules/
pushd build
pushd nodejs/node_modules

echo "removing unnecessary files"
rm -rf aws-sdk
rm -rf @types
rm -rf typescript
rm -rf ts-node
rm -rf aws-sdk
rm -rf aws-lambda
rm -rf @tsconfig
rm -rf .bin
find . -name "*.md" -delete

echo "zipping node_modules layer"
popd
zip -r ../build/layer.zip .
popd
