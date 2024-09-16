from flask import Flask, request, render_template

# from flask_cors import CORS

from fetch_prices import get_all_prices, nearby_prices


app = Flask(__name__)
# CORS(app)
all_prices = get_all_prices()


@app.route("/")
def main():
    return render_template("index.html")


@app.route("/prices", methods=["GET"])
def prices():
    query_location = request.args["location"]
    local_fuel_prices = nearby_prices(all_prices, query_location)
    if not local_fuel_prices:
        return {"message": "No fuel stations found."}, 404
    return local_fuel_prices
