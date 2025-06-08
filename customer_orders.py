from generate_stock import StockProperties
from market_maker import MarketMaker
from mockboard import MockBoard
import random
import re


def get_digits_prefix(text):
    match = re.match(r"^[\d.]+", text)
    return match.group(0) if match else ""


class CustomerOrders:
    def __init__(self, stockinfo: StockProperties, mm: MarketMaker):
        self.stockinfo = stockinfo
        self.mm = mm
        self.orders = dict()  # (ins, strike, side) : (price, size)
        self.P = 0.5  # probability of informed customer
        self.Pmarket = 0.6  # probability of making market before cust order

    def best_bid_ask(self):
        # get second best bid and ask in resting orders
        buy_prices = [value[0] for key, value in self.orders.items() if key[2] == 1]
        sell_prices = [value[0] for key, value in self.orders.items() if key[2] == -1]

        second_highest_buy = 0
        if len(buy_prices) >= 2:
            buy_prices.sort(reverse=True) # Sort descending for highest
            second_highest_buy = buy_prices[1]

        second_lowest_sell = 1e6
        if len(sell_prices) >= 2:
            sell_prices.sort() # Sort ascending for lowest
            second_lowest_sell = sell_prices[1]

        return second_highest_buy, second_lowest_sell

    def generate_order(self, quote=None):
        informed = random.random() < self.P
        edge = random.expovariate(lambd=80)  # mean 1/80
        """
        if informed, 
            - if market maker range contains fair then buy or sell a few cents
              away from fair.
            - if market maker range outside fair then place order in direction
              of fair up to at most mm.edge away from their quotes. If quotes
              have been provided for instrument, this is a market order
        if not informed,
            - generate new fair with distribution around mid and behave like informed
        """
        fair = self.stockinfo.stock
        if not informed:
            fair = random.gauss(self.mm.mid, self.mm.width)

        bid, ask = self.mm.bid, self.mm.offer
        if quote is not None:
            bid, ask = quote

        side = 1 if fair > (bid+ask)/2 else -1
        price = None
        if bid <= fair <= ask:
            price = fair - side * edge
        elif fair > ask:
            side = 1
            price = random.uniform(ask + 0.01, ask + self.mm.edge)
        elif fair < bid:
            side = -1
            price = random.uniform(bid - self.mm.edge, bid - 0.01)

        return side, price

    def generate_good_order(self, quote=None):
        # ensures that generated order beats second best bid or ask
        bb, bo = self.best_bid_ask()
        side = 1
        price = -1
        while (side == 1 and price < bb) or (side == -1 and price > bo):
            side, price = self.generate_order(quote)
        return side, price

    def parse_action(self, action):
        """
        possible actions:
            - trade resting order "sell 75 combo"
            - buy/sell stock "sell 76.40 10k"
            - next step "done"
        """
        try:
            if "done" in action or action == "":
                # new customer order and print resting orders
                self.next_step()
                return
            if action[-1] == "k":
                side, price, size = action.split()
                price = float(price)
                size = int(size[:-1]) * 10
                # shares transaction
                newquote = self.mm.trade(side, price, size)
                print(newquote)
            else:
                side, strike, ins = action.split(" ", 2)
                strike = round(float(get_digits_prefix(strike)), 1)
                side = "offer" if side == "buy" else "bid"
                s = -1 if side == "offer" else 1
                custtext = self.stockinfo.ins_to_text(ins, strike) + f" {side}"
                if (ins, strike, s) in self.orders:
                    price, size = self.orders.pop((ins, strike, s))
                    print(f"Traded {size}x {custtext} at {price:.2f}")
                else:
                    print(f"{custtext} not found")
                    print(self.orders.keys())
        except:
            print("could not parse action")

    def next_step(self):
        # print resting orders then
        # either ask for market or show customer order
        '''
        if len(self.orders) > 0:
            print("Resting orders:")
            for key in self.orders:
                ins, strike, side = key
                price, size = self.orders[key]
                side = "bid" if side == 1 else "offer"
                print(
                    f"{self.stockinfo.ins_to_text(ins, strike)} {size}x {side} {price:.2f}"
                )
            print("\n")
        '''

        ins, strike = self.stockinfo.choose_ins(self.mm.mid)
        size = self.mm.DEFAULT_SZ * random.randint(1, 13)
        instext = self.stockinfo.ins_to_text(ins, strike)
        quote = None
        stockquote = None
        if random.random() < self.Pmarket:
            print(f"Make a market in {instext} {size}x")
            quote = list(map(float, input().split()))
            stockquote = tuple(
                map(lambda p: self.stockinfo.ins_to_stock(p, ins, strike), quote)
            )
            stockquote = tuple(sorted(stockquote))
            print("implied stock", stockquote)  # optional: remove after testing

        s, price = self.generate_good_order(stockquote)
        # print(f"(stock {s} {price}", end="")
        s, price = self.stockinfo.stock_to_ins(s, price, ins, strike)
        # print(f"{instext} {s} {price})")  # TODO: remove after testing
        side = "bid" if s == 1 else "offer"
        if quote is not None and side == "bid" and price >= quote[1]:
            print(f"Cust buys at {quote[1]}")
        elif quote is not None and side == "offer" and price <= quote[0]:
            print(f"Cust sells at {quote[0]}")
        else:
            print(f"{instext} {size}x cust {side}s {price:.2f}")
            if (ins, strike, s) in self.orders:
                oldprice, _ = self.orders[(ins, strike, s)]
                self.orders[(ins, strike, s)] = (s * max(s * oldprice, s * price), size)
            else:
                self.orders[(ins, strike, s)] = (price, size)

    def start(self):
        print(self.mm.quote())
        self.next_step()
        while True:
            action = input()
            if "quit" in action:
                break
            self.parse_action(action)


if __name__ == "__main__":
    stockinfo = StockProperties()
    mm = MarketMaker(stockinfo)
    cust = CustomerOrders(stockinfo, mm)
    board = MockBoard(stockinfo, mm.mid, mm.quote())
    board.print_board()
    cust.start()
