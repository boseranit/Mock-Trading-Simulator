import random
from generate_stock import StockProperties


def print_options_board(calls, strikes, puts):
    # Find the maximum width for each column
    call_width = 5
    strike_width = 7
    put_width = 5

    # Print the header
    print(
        f"{'calls':>{call_width}}  {'strikes':>{strike_width}}  {'puts':>{put_width}}"
    )
    # Print the rows
    for call, strike, put in zip(calls, strikes, puts):
        print(
            f"{call:>{call_width}.2f}  {strike:^{strike_width}}  {put:>{put_width}.2f}"
        )


class MockBoard:
    def __init__(self, stockinfo: StockProperties, stock=None, quote=None):
        self.stockinfo = stockinfo
        self.stock = stock
        if stock is None:
            self.stock = self.stockinfo.stock
        self.quote = quote

    def print_board(self):
        stock = self.stock
        rc = self.stockinfo.rc
        strikes = self.stockinfo.strikes
        calls, puts = self.stockinfo.get_options(stock)

        if self.quote is not None:
            print(self.quote)
        else:
            print(f"S = {stock:.2f}")
        print(f"r/c = {rc:.2f}")

        bw = f"{strikes[0]} B/W={puts[0] + rc:.2f}"
        ps = f"{strikes[1]}/{strikes[2]} PS={puts[2] - puts[1]:.2f}"
        strad = f"{strikes[2]} ∀={calls[2] + puts[2]:.2f}"
        cs = f"{strikes[2]}/{strikes[3]} CS={calls[2] - calls[3]:.2f}"
        pns = f"{strikes[4]} P+S={calls[4] - rc:.2f}"

        print(" " * 19 + f"{strikes[0]:<6}{bw:19}")
        print(" " * 19 + f"{strikes[1]:<6}{ps:19}")
        print(f"{cs:19}{strikes[2]:<6}{strad:19}")
        print(" " * 19 + f"{strikes[3]:<6}")
        print(f"{pns:19}{strikes[4]:<6}")

        print("Press enter to see answers...")
        input()
        print_options_board(calls, strikes, puts)

    def make_markets(self):
        stock = self.stock
        rc = self.stockinfo.rc
        strikes = self.stockinfo.strikes
        calls, puts = self.stockinfo.get_options(stock)
        print("Press enter to make markets...")
        while True:
            action = input()
            if action == "q":
                break
            k = random.choice(strikes)
            i = random.randint(0, 3)
            fair = 0
            if random.random() < 0.5:
                fair = abs(stock - k + rc)
                print(f"Make a market in {k} combos", end="\r")
            else:
                ins = random.choice(["RR", "CS", "PS"])
                print(f"Make a market in {strikes[i]}/{strikes[i + 1]} {ins}", end="\r")
                if ins == "RR":
                    fair = abs(puts[i] - calls[i + 1])
                elif ins == "CS":
                    fair = calls[i] - calls[i + 1]
                elif ins == "PS":
                    fair = puts[i + 1] - puts[i]

            answer = input()
            print(f"fair price = {fair:.2f}")


if __name__ == "__main__":
    stockinfo = StockProperties()
    mockboard = MockBoard(stockinfo)
    mockboard.print_board()
    mockboard.make_markets()
