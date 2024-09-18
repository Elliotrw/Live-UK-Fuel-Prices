from geopy import distance
from geopy.geocoders import Nominatim


def get_lat_lon(location_str):
    geolocator = Nominatim(user_agent="UKFP")
    location = geolocator.geocode(location_str, country_codes='GB')

    if location:
        return location.latitude, location.longitude
    else:
        return None, None


def is_within_distance(user_location, station_location, max_distance=5):
    user_coords = (user_location["latitude"], user_location["longitude"])
    station_coords = (station_location["latitude"], station_location["longitude"])

    return distance.distance(user_coords, station_coords).miles <= max_distance
