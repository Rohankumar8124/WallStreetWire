import React, { Component } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    PointElement, 
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement);

class Analyzer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stockQuery: "", // User input for stock search
            suggestions: [], // Fetched suggestions for stock search
            stockData: null, // Data of the selected stock
            historicalData: [], // Historical adjusted close data
            predictedPrices: [], // Predicted prices for the next 10 days
            trend: "",
        };
        this.debounceTimer = null; // Timer for debouncing
        this.chartRef = React.createRef(); // Create a ref for the chart
    }

    // Destroy the chart before unmounting the component to prevent canvas reuse error
    componentWillUnmount() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    handleInputChange = (event) => {
        const stockQuery = event.target.value;
        this.setState({ stockQuery });

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (stockQuery.trim() !== "") {
                this.fetchSuggestions(stockQuery);
            } else {
                this.setState({ suggestions: [] });
            }
        }, 300);
    };

    fetchSuggestions = async (query) => {
        const apiUrl = `/v1/finance/search?q=${query}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Failed to fetch suggestions");

            const data = await response.json();
            const suggestions = data.quotes
                .filter((item) => {
                    const symbol = item.symbol;
                    const longname = item.longname;

                    const isOption = /(\d+)[CP]\d+/.test(symbol);
                    const isETF = /ETF|Bull|Bear|\d+x/.test(longname);
                    const isCurrencyPairOrRatio = /[=/]/.test(symbol);

                    return symbol && longname && !isOption && !isETF && !isCurrencyPairOrRatio;
                })
                .map((item) => ({
                    symbol: item.symbol,
                    name: item.longname,
                }));

            this.setState({ suggestions });
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    };

    handleSuggestionClick = (symbol) => {
        this.setState({ stockQuery: symbol, suggestions: [] });
        this.fetchStockData(symbol);
    };

    fetchPredictions = async () => {
        const { historicalData } = this.state;
        console.log(historicalData);
        if (historicalData.length === 0) {
            console.error("No historical data available");
            return;
        }

        try {
            // Validate incoming data
            if (!historicalData || !Array.isArray(historicalData)) {
                console.error("Invalid data format");
                return;
            }

            // Extract closing prices
            let closingPrices = [];
            try {
                closingPrices = historicalData.map(point => point.close);
            } catch (error) {
                console.error("Error extracting closing prices:", error);
                return;
            }

            const interval = 5;
            const futurePrices = [];

            // Generate future prices based on the moving average logic
            for (let i = 0; i < 10; i++) {
                const movingAverage = closingPrices.slice(-interval).reduce((sum, price) => sum + price, 0) / interval;
                futurePrices.push(movingAverage);
                closingPrices.push(movingAverage);
            }

            const predictions = futurePrices.map((price, index) => ({
                day: index + 1,
                price: parseFloat(price.toFixed(2)),
            }));

            // Determine the trend based on the first and last predicted prices
            const trend = predictions[0].price < predictions[predictions.length - 1].price ? "up" : "down";

            // Update state with predictions and trend
            this.setState({
                predictedPrices: predictions,
                trend: trend,
            });

            console.log(predictions);
            console.log(predictions.length - 1);
            console.log(trend);

        } catch (error) {
            console.error("Error generating predictions:", error);
        }
    };



    fetchStockData = async (symbol) => {
        const apiUrl = `/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Failed to fetch stock data");

            const data = await response.json();
            const result = data.chart.result[0];
            const longname = result.meta.longName;
            const currentPrice = result.meta.regularMarketPrice;
            const historicalData = result.indicators.quote[0].close.map((close, index) => ({
                date: new Date(result.timestamp[index] * 1000),
                close,
                high: result.indicators.quote[0].high[index],
                low: result.indicators.quote[0].low[index],
                open: result.indicators.quote[0].open[index],
            }));

            const lastData = historicalData[historicalData.length - 1];
            this.setState(
                {
                    stockData: {
                        symbol: symbol,
                        longname: longname,
                        currentPrice: currentPrice.toFixed(2),
                        high: lastData.high.toFixed(2),
                        low: lastData.low.toFixed(2),
                        open: lastData.open.toFixed(2),
                        close: lastData.close.toFixed(2),
                    },
                    historicalData: historicalData,
                },
                () => {
                    // Fetch predictions only after state is updated
                    this.fetchPredictions();
                }
            );
        } catch (error) {
            console.error("Error fetching stock data:", error);
        }
    };



    render() {
        const { stockQuery, suggestions, stockData, historicalData } = this.state;
        const { mode } = this.props;

        const chartData = {
            labels: historicalData.map((data) => data.date.toLocaleDateString()),
            datasets: [
                {
                    label: "Adjusted Closing Price",
                    data: historicalData.map((data) => data.close),
                    borderColor: "#40e0d0",
                    backgroundColor: "rgba(64, 224, 208, 0.1)",
                    tension: 0.2,
                },
                {
                    label: "High Price",
                    data: historicalData.map((data) => data.high || 0), // Ensure data exists
                    borderColor: "rgba(255, 99, 132, 1)", // Red color for high
                    backgroundColor: "rgba(255, 99, 132, 0.2)", // Light red
                    tension: 0.2,
                },
                {
                    label: "Low Price",
                    data: historicalData.map((data) => data.low || 0), // Ensure data exists
                    borderColor: "rgba(54, 162, 235, 1)", // Blue color for low
                    backgroundColor: "rgba(54, 162, 235, 0.2)", // Light blue
                    tension: 0.2,
                },
                {
                    label: "Opening Price",
                    data: historicalData.map((data) => data.open || 0), // Ensure data exists
                    borderColor: "rgb(238, 248, 92)", // Green color for opening
                    backgroundColor: "rgba(75, 192, 192, 0.2)", // Light green
                    tension: 0.2,
                },
            ],
        };




        return (
            <div className="container my-2">
                <h1
                    className="d-flex justify-content-center flex-wrap"
                    style={{ color: mode === "dark" ? "grey" : "rgb(67, 65, 65)" }}
                >
                    Stock Analyzer
                </h1>

                {/* Search Box */}
                <div
                    className="mb-4 position-relative"
                    style={{
                        border: mode === "dark" ? "2px solid turquoise" : "",
                        borderRadius: mode === "dark" ? "0.5rem" : "",
                    }}
                >
                    <input
                        type="text"
                        className={`form-control ${mode === "dark" ? "bg-dark text-white" : "bg-light text-dark"
                            }`}
                        placeholder="Search for a stock..."
                        value={stockQuery}
                        onChange={this.handleInputChange}
                    />
                    {suggestions.length > 0 && (
                        <ul
                            className={`list-group position-absolute w-100 mt-1 ${mode === "dark" ? "bg-dark" : "bg-light"
                                }`}
                            style={{ zIndex: 10 }}
                        >
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className={`list-group-item ${mode === "dark"
                                            ? "text-white bg-dark"
                                            : "text-dark bg-light"
                                        }`}
                                    onClick={() => this.handleSuggestionClick(suggestion.symbol)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {suggestion.symbol} - {suggestion.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="row">
                    <div
                        className="col-12 col-md-4 text-center"
                        style={{
                            color: mode === "dark" ? "grey" : "rgb(67, 65, 65)",
                        }}
                    >
                        {stockData && (
                            <div>
                                <h3>{stockData.longname}</h3>
                                <p>Current Price: USD {stockData.currentPrice}</p>
                                <p>Yesterday's High: USD {stockData.high}</p>
                                <p>Yesterday's Low: USD {stockData.low}</p>
                                <p>Yesterday's Open: USD {stockData.open}</p>
                                <p>Yesterday's Close: USD {stockData.close}</p>
                            </div>
                        )}
                    </div>

                    <div className="col-12 col-md-8">
                        {historicalData.length > 0 && (
                            <div className="mt-4" style={{ height: "300px", width: "100%" }}>
                                <Line
                                    ref={this.chartRef}
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false, // Ensures the graph fills the container
                                        scales: {
                                            x: {
                                                type: "category",
                                                ticks: {
                                                    color: mode === "dark" ? "grey" : "black",
                                                },
                                                grid: {
                                                    color: mode === "dark"
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "rgba(0, 0, 0, 0.1)",
                                                },
                                            },
                                            y: {
                                                ticks: {
                                                    color: mode === "dark" ? "grey" : "black",
                                                },
                                                grid: {
                                                    color: mode === "dark"
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "rgba(0, 0, 0, 0.1)",
                                                },
                                            },
                                        },
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: mode === "dark" ? "grey" : "black",
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {!stockData && (
                    <h6
                        className="d-flex justify-content-center flex-wrap"
                        style={{
                            color: mode === "dark" ? "turquoise" : "rgb(67, 65, 65)",
                        }}
                    >
                        Enter Name of a Stock to see the Stats!
                    </h6>
                )}

                <div className="d-flex flex-wrap align-items-center justify-content-between mt-4 gap-0">
                    <div className="col-12 col-md-3 mb-3 mb-md-0">
                        {this.state.trend && (
                            <button
                                className={`btn ${this.state.trend === "up" ? "btn-success" : "btn-danger"
                                    }`}
                                style={{
                                    pointerEvents: "none",
                                    width: "100%", 
                                }}
                            >
                                {this.state.trend === "up" ? "Going Up ↑" : "Going Down ↓"}
                            </button>
                        )}
                    </div>

                    <div className="col-12 col-md-8">
                        {this.state.predictedPrices.length > 0 && (
                            <div style={{ height: "300px", width: "100%" }}>
                                <Line
                                    data={{
                                        labels: Array.from(
                                            { length: 10 },
                                            (_, i) => `Day ${i + 1}`
                                        ),
                                        datasets: [
                                            {
                                                label: "Predicted Closing Price",
                                                data: this.state.predictedPrices.map(
                                                    (item) => item.price
                                                ),
                                                borderColor: "#FFA500",
                                                backgroundColor: "rgba(255, 165, 0, 0.2)",
                                                tension: 0.2,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: {
                                                type: "category",
                                                ticks: {
                                                    color: mode === "dark" ? "grey" : "black",
                                                },
                                                grid: {
                                                    color: mode === "dark"
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "rgba(0, 0, 0, 0.1)",
                                                },
                                            },
                                            y: {
                                                ticks: {
                                                    color: mode === "dark" ? "grey" : "black",
                                                },
                                                grid: {
                                                    color: mode === "dark"
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "rgba(0, 0, 0, 0.1)",
                                                },
                                            },
                                        },
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: mode === "dark" ? "white" : "black",
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default Analyzer;