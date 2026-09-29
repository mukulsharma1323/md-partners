# md-desk

React Native retail pharmacy app for Meri Davai desk.

## Setup

```sh
npm install
cd ios && bundle install && bundle exec pod install
```

Run with `npm run android` or `npm run ios`. The app needs access to the configured backend and a user with retail sales permissions. See [backend integration](docs/backend-integration.md).

## Checks

```sh
npm test -- --runInBand
npm run lint
```
