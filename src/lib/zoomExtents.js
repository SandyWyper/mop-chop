//depending on the size of the search radius, decide what zoom setting to display the map on.
export function zoomExtents(searchRadius) {
  switch (searchRadius) {
    case '500':
      return 15;
    // break;
    case '1000':
      return 14;
    // break;
    case '2000':
      return 13;
    case '3000':
      return 13;
    case '4000':
      return 13;
    case '5000':
      return 12;
    default:
      return 13;
  }
}
