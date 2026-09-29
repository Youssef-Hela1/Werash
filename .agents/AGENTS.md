# Project-Scoped Rules for Werash

## Multi-Generation Car Models rule
Whenever a car model is registered with multiple entries or year ranges under the same name (indicating different generations or visual styles) in the database/zip files:
1. **Consolidate Option**: Combine them into a single selection option under that model name in [carModels.js](file:///c:/Users/youss/OneDrive/Desktop/Werash/werash-application/src/data/carModels.js).
2. **Year Spans**: Set the selectable year range from the minimum start year of the oldest generation to the maximum end year of the newest generation.
3. **Map Images**: Extract all corresponding images from the database and map them inside the model object using the `images` array structure:
   ```javascript
   {
     name: 'ModelName',
     startYear: minYear,
     endYear: maxYear,
     images: [
       { startYear: startY1, endYear: endY1, image: require('path/to/image1.png') },
       { startYear: startY2, endYear: endY2, image: require('path/to/image2.png') }
     ]
   }
   ```
4. **Dynamic UI Resolution**: Ensure that the UI components (like [ActiveVehicleCard.js](file:///c:/Users/youss/OneDrive/Desktop/Werash/werash-application/src/components/ActiveVehicleCard.js)) look up and render the correct image based on the selected manufacturing year of the vehicle.
