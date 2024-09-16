import requests

from fetch_retailers import fetch_fuel_retailers
from location import get_lat_lon, is_within_distance


def get_all_prices():
    print("Fetching prices...")
    price_data = []
    for retailer in fetch_fuel_retailers():
        name, url = retailer["retailer"], retailer["url"]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching {name}: {e}")
            continue

        try:
            data = response.json()
        except requests.exceptions.JSONDecodeError as e:
            print(f"Error decoding {name} JSON: {e}")
            print(response.text)
            continue
        price_data.append({"retailer": name, "data": data})

    return price_data


def nearby_prices(all_prices, location):
    latitude, longitude = get_lat_lon(location)

    if latitude and longitude:
        nearby_stations = [
            {"query_location": {"latitude": latitude, "longitude": longitude}}
        ]
        for retailer in all_prices:
            name = retailer["retailer"]
            station_data = retailer["data"]
            filtered_stations = []
            for station in station_data["stations"]:
                station_latitude = station["location"]["latitude"]
                station_longitude = station["location"]["longitude"]
                if is_within_distance(
                    {"latitude": latitude, "longitude": longitude},
                    {"latitude": station_latitude, "longitude": station_longitude},
                ):
                    filtered_stations.append(station)
            if filtered_stations:  # Remove retailer if no stations are nearby
                nearby_stations.append(
                    {
                        "retailer": name,
                        "data": {
                            "last_updated": station_data["last_updated"],
                            "stations": filtered_stations,
                        },
                    }
                )
        return nearby_stations
