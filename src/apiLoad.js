const loadGoogleMapsApi = require('load-google-maps-api');

class MapApi {
  static loadGoogleMapsApi() {
    return loadGoogleMapsApi({
      key: secrets.MAPS_API,
      libraries: ['places'],
    });
  }
}
export { MapApi };
