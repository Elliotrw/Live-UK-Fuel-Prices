var map, lc, markers;
const cameraZoom = 12.3;


function requestLocation() {
    return L.control.locate({
        locateOptions: {
            maxZoom: cameraZoom,
            enableHighAccuracy: true,
            setView: 'always'
        }
    }).addTo(map);
}


function onLocationFound(e) {
    // const MAX_ACCURACY_THRESHOLD = 100;  // meters
    const MAX_ACCURACY_THRESHOLD = 200000;  // TEMP

    var radius = e.accuracy;
    var location = e.latlng.lat + ", " + e.latlng.lng;
    if (radius <= MAX_ACCURACY_THRESHOLD) {
        lc.stop();
    }
    else {
        console.log("Location accuracy is too low: " + radius + " meters");
        lc = requestLocation();
    }
    fetchAndAddMarkers(location);
}


function onLocationError(e) {
    console.error(e.message);
    lc.stop();
}


async function getPrices(location) {
    try {
        const response = await fetch(`/prices?location=${encodeURIComponent(location)}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error.message);
    }
}


function clearMarkers() {
    if (markers != null) {
        map.removeLayer(markers);
    }
}


function processFuelData(apiData) {
    // Convert the API data object to an array of values
    return Object.values(apiData);
}


function addMarkersFromAPI(retailerDataArray, latitude, longitude) {
    markers = L.markerClusterGroup({
        disableClusteringAtZoom: Math.floor(cameraZoom)  // integers only
    });

    const circle = L.circleMarker([latitude, longitude], {
        radius: 8,
        color: 'blue',
        fillColor: '#3388ff',
        fillOpacity: 0.7
    });
    markers.addLayer(circle);

    var redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    retailerDataArray.forEach(retailerData => {
        const { data, retailer } = retailerData;

        if (data && data.stations) {
            data.stations.forEach(station => {
                const stationLatLng = L.latLng(station.location.latitude, station.location.longitude);
                const { latitude, longitude } = station.location;  // TODO: ignore lat&long = 0 (from Motor Fuel Group 7zzzzzzzzzzz)

                let popupContent = `<b>${station.brand}</b><br>${station.address}<br>Postcode: ${station.postcode}<br><br>`;

                if (station.prices) {
                    if (station.prices.E10) popupContent += `Unleaded: <b>${station.prices.E10}</b><br>`;
                    if (station.prices.E5) popupContent += `Super Unleaded: <b>${station.prices.E5}</b><br>`;
                    if (station.prices.B7) popupContent += `Diesel: <b>${station.prices.B7}</b><br>`;
                    if (station.prices.SDV) popupContent += `Premium Diesel: <b>${station.prices.SDV}</b><br>`;
                }

                popupContent += `<br><small>Provider: ${retailer}</small>`;
                popupContent += `<br><small>Last updated: ${data.last_updated}</small>`;
                popupContent += `<br><small><a href="https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}" target="_blank">Directions</a>`;

                const redMarker = L.marker([station.location.latitude, station.location.longitude], { icon: redIcon })
                    .bindPopup(popupContent);

                markers.addLayer(redMarker);
            });
        }
    });

    map.addLayer(markers);
}


async function fetchAndAddMarkers(user_location) {
    const fuel_data = await getPrices(user_location);
    clearMarkers();
    retailerDataArray = processFuelData(fuel_data);
    const { latitude, longitude } = retailerDataArray[0].query_location;
    addMarkersFromAPI(retailerDataArray, latitude, longitude);
    map.setView([latitude, longitude], cameraZoom);
}


function search(searchbox) {
    var value = searchbox.getValue();
    if (value != "") {
        fetchAndAddMarkers(value);
    }

    setTimeout(function () {
        searchbox.hide();
        searchbox.clear();
    }, 600);
}


function init() {
    map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    lc = requestLocation();
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    lc.start();

    var searchbox = L.control.searchbox({
        position: 'topright',
        expand: 'left',
        iconPath: '/static/search_icon.png',
    }).addTo(map);

    searchbox.onInput("keyup", function (e) {
        if (e.keyCode == 13) {
            search(searchbox);
        }
    });

    searchbox.onButton("click", function () {
        search(searchbox);
    });
}
