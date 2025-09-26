import React, { Component } from "react";
import Newsitem from "./Newsitem";
import "./News.css";

class News extends Component {
    constructor(properties) {
        super(properties);
        this.state = {
            articles: [], // Holds the fetched news articles
            stockQuery: "", // The query typed by the user
            suggestions: [], // Holds the list of fetched suggestions
        };
        this.debounceTimer = null; // Timer for debouncing
    }

    handleInputChange = (event) => {
        const stockQuery = event.target.value;
        this.setState({ stockQuery });

        // Debounce the API call
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (stockQuery.trim() !== "") {
                this.fetchSuggestions(stockQuery);
            } else {
                this.setState({ suggestions: [] }); // Clear suggestions if input is empty
            }
        }, 300); // Delay of 300ms
    };

    fetchSuggestions = async (query) => {
        const apiUrl = `/v1/finance/search?q=${query}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Failed to fetch suggestions");
            }

            const data = await response.json();

            const suggestions = data.quotes
                .filter((item) => {
                    const symbol = item.symbol;
                    const longname = item.longname;

                    // Filter out options symbols (symbols with C or P)
                    const isOption = /(\d+)[CP]\d+/.test(symbol);

                    // Filter out symbols with terms indicating ETFs, Bull/Bear products, etc.
                    const isETF = /ETF|Bull|Bear|\d+x/.test(longname);

                    // Filter out symbols with '=' (currency pairs like AMD=X) or '/' (ratios like AMD/BRX)
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
        this.fetchNewsArticles(symbol); // Fetch articles for the selected stock
    };

    fetchNewsArticles = async (stockQuery) => {
        const apiUrl = `/v1/finance/search?q=${stockQuery}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Failed to fetch news articles");
            }

            const data = await response.json();
            const articles = (data.news || [])
                .filter((article) => article.thumbnail)
                .map((article) => ({
                    title: article.title,
                    description: article.summary,
                    url: article.link,
                    urlToImage: article.thumbnail.resolutions[0]?.url,
                    publishedAt: article.publishedAt || article.providerPublishTime,
                }))
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            this.setState({ articles });
        } catch (error) {
            console.error("Error fetching articles:", error);
            alert("Failed to fetch news articles. Please try again.");
        }
    };

    render() {
        const { articles, stockQuery, suggestions } = this.state;
        const { mode } = this.props;

        return (
            <>
                <div className="container my-2">
                    <h1 className="d-flex justify-content-center flex-wrap" style={{ color: mode === "dark" ? "grey" : "rgb(67, 65, 65)" }}>Get News on any Stock!</h1>
                    {/* Search Box */}
                    <div className="mb-4 position-relative">
                        <input
                            type="text"
                            className={`form-control ${mode === "dark" ? "bg-dark text-white" : "bg-light text-dark"}`}
                            placeholder="Search for a stock name..."
                            value={stockQuery}
                            onChange={this.handleInputChange}
                        />
                        {/* Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <ul
                                className={`list-group position-absolute w-100 mt-1 ${mode === "dark" ? "bg-dark" : "bg-light"}`}
                                style={{ zIndex: 10 }}
                            >
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className={`list-group-item ${mode === "dark" ? "text-white bg-dark" : "text-dark bg-light"}`}
                                        onClick={() => this.handleSuggestionClick(suggestion.symbol)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {suggestion.symbol} - {suggestion.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* News Feed */}
                    <div className="d-flex justify-content-center flex-wrap">
                        {articles.length > 0 ? (
                            articles.map((article, index) => (
                                <div key={index} className="mx-3 my-3" style={{ width: "18rem" }}>
                                    <Newsitem article={article} mode={mode} />
                                </div>
                            ))
                        ) : (
                            <p className="text-center" style={{ color: mode === "dark" ? "grey" : "black" }}>No articles to display. Search for a stock to get started!</p>
                        )}
                    </div>
                </div>
            </>
        );
    }
}

export default News;
