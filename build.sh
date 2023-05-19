set -ex

rm -rf dist/

PKG_HASH=$(shasum --algorithm 1 yarn.lock | awk '{print $1}')

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
zip -qr ../build/function.zip .
popd

echo "preparing node_modules layer"
cp -r node_modules build/nodejs/node_modules/
pushd build
pushd nodejs/node_modules

echo "removing unnecessary files"
rm -rf aws-sdk @types typescript ts-node @aws-sdk aws-lambda @tsconfig .bin
find . -name "*.md" -delete

echo "zipping node_modules layer"
popd
zip -qr ../build/layer.$PKG_HASH.zip .
popd
