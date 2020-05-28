# High-5! [^1]

> Use the Google Maps APIs to search for specific businesses within a given search radius and rank them by user rating.

### Application purpose

- Search for 'hair-care', 'beauty-salon', 'cafe', 'restaurant', 'meal-takeaway' or 'rv-park' within a certain radius of a given location.
- Results are sorted by rating, but places with < 5 ratings are ignored.
- a map of the location is shown with a marker for top 5 results.
- Names, ratings and additional information of the locations is displayed.
  _ address
  _ phone number
  _ photos
  _ reviews
  _ link to their website
  _ opening hours

---

### Technologies Used

This was the first time I have used the **Google maps platform**. This web-app utilises the **maps**, **places** and **goecode** libraries. Also the **autocomplete** api from the places library for text input.

This is also my first time using:

- **Webpack** and modular javascript
- **Lodash** for array manipulation

[^1]: Originally called 'Mop-Chop-Shop' as it used to only query for 'hair-care' locations.
