const loadGoogleMapsApi = require('load-google-maps-api');

class MapApi {
  static loadGoogleMapsApi() {
    return loadGoogleMapsApi({
      key: 'AIzaSyDIfb1nXWDg2kwRNTseTnBuIcPrB-2DqMM',
      libraries: ['places'],
    });
  }
}
export { MapApi };
