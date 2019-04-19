const loadGoogleMapsApi = require('load-google-maps-api');

class MapApi {
  
  static loadGoogleMapsApi() {
    return loadGoogleMapsApi({ 
    	key: 'AIzaSyAvGb6zn5DU74zcegK54EVvr6GMQAFdC5o',
     	libraries: ['places']
     });
  }
}
export { MapApi };