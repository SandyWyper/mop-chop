const loadGoogleMapsApi = require('load-google-maps-api');

class MapApi {
  static loadGoogleMapsApi() {
    return loadGoogleMapsApi({
      key: 'AIzaSyBhF6NIX0O2cmBMx3IpHtrvkyc09YfioMg',
      libraries: ['places'],
    });
  }
}
export { MapApi };
