const loadGoogleMapsApi = require('load-google-maps-api');

class MapApi {
  static loadGoogleMapsApi() {
    return loadGoogleMapsApi({
      key: 'AIzaSyBtfdaRKDner6wFFbDM9_qK34bKjJha0P0',
      libraries: ['places'],
    });
  }
}
export { MapApi };
