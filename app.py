import re

from flask import Flask, request, render_template, jsonify

from fetch_prices import get_all_prices, nearby_prices
from location import get_lat_lon


app = Flask(__name__)
all_prices = get_all_prices()


@app.route("/")
def main():
    return render_template("index.html")


@app.route("/prices", methods=["GET"])
def prices():
    query_location = request.args["location"]

    validation_result = validate_search_term(query_location)
    if not validation_result:
        return jsonify({"error": "Invalid search term"}), 400

    latitude, longitude = get_lat_lon(query_location, validation_result)
    if not latitude and not longitude:
        return {"message": "Location not found."}, 400
    local_fuel_prices = nearby_prices(all_prices, latitude, longitude)
    if not local_fuel_prices:
        return {"message": "No fuel stations found."}, 200
    return local_fuel_prices


def validate_search_term(term):
    postcode_regex = r"^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$"
    coordinate_regex = r"^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$"

    if re.match(coordinate_regex, term):
        return "coordinates"

    if re.match(postcode_regex, term, re.IGNORECASE):
        return "postcode"

    if len(term) > 2:
        return "location"

    return False
