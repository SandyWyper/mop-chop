  const initialMapStyling = {
      zoom: 6,
      center: { lat: 54.4808, lng: -4.2426 },
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [{
              "elementType": "geometry",
              "stylers": [{
                  "color": "#ebe3cd"
              }]
          },
          {
              "elementType": "labels",
              "stylers": [{
                  "visibility": "off"
              }]
          },
          {
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#523735"
              }]
          },
          {
              "elementType": "labels.text.stroke",
              "stylers": [{
                  "color": "#f5f1e6"
              }]
          },
          {
              "featureType": "administrative",
              "elementType": "geometry.stroke",
              "stylers": [{
                  "color": "#c9b2a6"
              }]
          },
          {
              "featureType": "administrative.land_parcel",
              "elementType": "geometry.stroke",
              "stylers": [{
                  "color": "#dcd2be"
              }]
          },
          {
              "featureType": "administrative.land_parcel",
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#ae9e90"
              }]
          },
          {
              "featureType": "landscape.natural",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#dfd2ae"
              }]
          },
          {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#dfd2ae"
              }]
          },
          {
              "featureType": "poi",
              "elementType": "labels",
              "stylers": [{
                  "visibility": "off"
              }]
          },
          {
              "featureType": "poi",
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#f23702"
              }]
          },
          {
              "featureType": "poi.park",
              "elementType": "geometry.fill",
              "stylers": [{
                  "color": "#a5b076"
              }]
          },
          {
              "featureType": "poi.park",
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#447530"
              }]
          },
          {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#f5f1e6"
              }]
          },
          {
              "featureType": "road",
              "elementType": "labels",
              "stylers": [{
                  "visibility": "off"
              }]
          },
          {
              "featureType": "road.arterial",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#fdfcf8"
              }]
          },
          {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#f7e8c8"
              }]
          },
          {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [{
                  "color": "#8b9acc"
              }]
          },
          {
              "featureType": "road.highway.controlled_access",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#e98d58"
              }]
          },
          {
              "featureType": "road.highway.controlled_access",
              "elementType": "geometry.stroke",
              "stylers": [{
                  "color": "#b7c1ca"
              }]
          },
          {
              "featureType": "road.local",
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#806b63"
              }]
          },
          {
              "featureType": "transit.line",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#dfd2ae"
              }]
          },
          {
              "featureType": "transit.line",
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#8f7d77"
              }]
          },
          {
              "featureType": "transit.line",
              "elementType": "labels.text.stroke",
              "stylers": [{
                  "color": "#ebe3cd"
              }]
          },
          {
              "featureType": "transit.station",
              "elementType": "geometry",
              "stylers": [{
                  "color": "#dfd2ae"
              }]
          },
          {
              "featureType": "water",
              "elementType": "geometry.fill",
              "stylers": [{
                  "color": "#b9d3c2"
              }]
          },
          {
              "featureType": "water",
              "elementType": "labels.text.fill",
              "stylers": [{
                  "color": "#92998d"
              }]
          }
      ]
  }

  export { initialMapStyling };