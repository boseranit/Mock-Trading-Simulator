"""
Need stock market maker to be separate from customer orders, as sometimes
they might not be impacting orders enough

At the same time, sometimes market maker can be informed of fair and can
show some width in a higher fair

Some customer orders are informed, and others aren't
"""

from scipy.stats import norm
import random
from generate_stock import StockProperties


class MarketMaker:
    def __init__(self, stockinfo):
        self.stockinfo = stockinfo
        self.CONV_WIDTH = random.triangular(0.02, 0.30, 0.10)
        self.alpha = 0.2  # weighting of new parameters
        self.mid = None
        self.width = None
        self.DEFAULT_SZ = random.randrange(30, 101, 10)
        self.adjust_width()

    def adjust_width(self):
        if self.width is None:
            self.width = max(random.weibullvariate(0.2, 1.5), 0.02)  # mean 0.155
            self.width = min(self.width, 0.4)
        else:
            self.width = (
                self.alpha * random.triangular(0.02, 2 * self.CONV_WIDTH - 0.02)
                + (1 - self.alpha) * self.width
            )
        self.edge = self.width / 2
        newprice = self.stockinfo.stock + random.gauss(0, 2 * self.edge)
        oldprice = self.mid
        uptick = newprice > (0 if self.mid is None else self.mid)
        if self.mid is None:
            self.mid = self.stockinfo.stock + random.choice([-1, 1]) * random.gauss(
                3 * self.edge, self.edge
            )
        else:
            self.mid = self.alpha * newprice + (1 - self.alpha) * self.mid
            self.mid = max(self.mid, oldprice - self.edge)
            self.mid = min(self.mid, oldprice + self.edge)
        self.impact = self.width * 10
        return uptick

    def format_quote(self, bid, bs, offer, os):
        return f"Stock: {bid:.2f}/{bs:.0f} @ {offer:.2f}/{os:.0f}"

    def quote(self, b=1, o=1):
        self.bid = self.mid - self.edge
        self.offer = self.mid + self.edge
        self.bidsize = round(self.DEFAULT_SZ * b / 10) * 10
        self.offersize = round(self.DEFAULT_SZ * o / 10) * 10
        return self.format_quote(self.bid, self.bidsize, self.offer, self.offersize)

    def trade(self, side, price, size):
        print("side", side, " price", price, " size", size)
        # trade size relative to stock quotes, typically mean 3
        rel_size = size / self.DEFAULT_SZ
        alpha = norm.cdf(rel_size, loc=3, scale=1.5)
        # cap the effect of price
        price = min(price, self.mid + rel_size * self.edge)
        price = max(price, self.mid - rel_size * self.edge)
        # allow for possibility that hitting bid does not move mid
        if (side == "buy" and price > self.mid) or (
            side == "sell" and price < self.mid
        ):
            self.mid = alpha * price + (1 - alpha) * self.mid

        # add in some random movement
        old_fair = self.mid
        uptick = self.adjust_width()
        # mid price cannot move in opposite direction to trade
        if side == "buy" and price > old_fair:
            self.mid = max(old_fair, self.mid)
        elif side == "sell" and price < old_fair:
            self.mid = min(old_fair, self.mid)

        b = 1
        o = 1
        rng = random.random()
        if uptick:
            if side == "buy" and rng < 0.5:
                o = 0.5
            if side == "sell" and rng < 0.5:
                b = 2
        else:
            if side == "sell" and rng < 0.5:
                b = 0.5
            if side == "buy" and rng < 0.5:
                o = 2
        return self.quote(b, o)


if __name__ == "__main__":
    stockinfo = StockProperties()
    mm = MarketMaker(stockinfo)
    print(mm.quote())
    while True:
        usertrade = input()
        side, price, size = usertrade.split()
        price = float(price)
        size = int(size)
        quote = mm.trade(side, price, size)
        print(quote)
