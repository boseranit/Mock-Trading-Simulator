Scenario list

With some probability, skip making market an directly show customer order

Action list:

- Buy/sell stock for certain size
- Provide two way market
- Trade cust order
- Do nothing

1. Cust wants market
    - Make market
    - Cust shows order inside market
        - Decision: if outside stock quotes, either test stock or trade
        - Decision: if inside stock quotes, adjust fair and remember implied price in stock
    - Cust trades on market
        - Decision: trade stock for edge if sufficient impact
2. Resting order inside market. Then make market
    - Make market with less impact on side of resting order
    - Cust shows order inside market
        - Decision: if cross market with resting order, trade one or both legs
        - Decision: if inside market, adjust fair and remember implied price in stock
    - Cust trades on market
        - Decision: trade stock or resting order for edge if sufficient impact

Situation 1: Trade stock for edge after making a market.

There is a stock market quoted, for instance 53.08 @ 53.12, 50 up; r/c = 5c. We are asked to make a market on 300x 55 combos. Estimate impact + edge, which could be 6c+3c=10c.

My market is 2.75 @ 2.95, keeping in mind what the fair, impact, and edge is.

Plan in advance what to do if customer either buys or sells.

- If customer buys puts over combos: stock fair has decreased at least 5c, so sell stock for edge. E.g. Sell 20k shares at 5.06
- If customer sells: stock fair has increased at least 5c, so buy stock for edge. E.g. Buy 20k shares at 5.14

Situation 2: Test stock after customer bids/offers large quantity

After we have made a market on combos, we have in mind what the fair and corresponding stock price is. Then customer bids inside the range. For example, bid $2.91 for 300x 55 combos.

Instantly convert into shares using previous fair, then test stock. E.g. Bid is 0.06 higher than 2.85, so implied offer at 53.04. Hence, sell 10k shares at 53.05.

- If new fair – impact – edge is above 53.05 then trade with customer, otherwise do nothing. Alternatively, if customer was implied bid in stock then buy shares and evaluate fair + impact + edge.

Tips:

If you see a large order selling/bidding outside of the market, immediately look to test stock up to near the implied price, with at least a quarter of the size.

There can be a customer looking to sell the same instrument, and you might need to test stock repeatedly to assess the impact of their size.

Think about how to decide before stock test whether to trade resting order.  
Fair + impact + edge

When stock trade for edge happens: make a market, then customer trades with you

When stock test happens: resting order which is outside market width