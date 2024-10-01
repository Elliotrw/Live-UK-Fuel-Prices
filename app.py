from flask import Flask, request, render_template

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

    latitude, longitude = get_lat_lon(query_location)
    if not latitude and not longitude:
        return {"message": "Location not found."}, 400
    local_fuel_prices = nearby_prices(all_prices, latitude, longitude)
    if not local_fuel_prices:
        return {"message": "No fuel stations found."}, 200
    return local_fuel_prices
