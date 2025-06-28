import numpy as np
from scipy.stats import norm
import random


def BS_CALL(S, K, T, r, q, sigma):
    d1 = (np.log(S / K) + (r - q + sigma**2 / 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * np.exp(-q * T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)


def BS_PUT(S, K, T, r, q, sigma):
    d1 = (np.log(S / K) + (r - q + sigma**2 / 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * np.exp(-q * T) * norm.cdf(-d1)


class StockProperties:
    def __init__(self):
        self.STRIKE_INC = random.choice([5, 5, 2.5])
        MIN_STRIKE = 20
        MAX_STRIKE = 90
        self.strikes = [random.randrange(MIN_STRIKE, MAX_STRIKE + 1, 5)]
        for i in range(4):
            self.strikes.append(self.round(self.strikes[-1] + self.STRIKE_INC))
        self.stock = self.strikes[2] + round(random.uniform(-3, 5), 2)

        self.div = random.uniform(0, 0.03)
        self.r = random.uniform(self.div+0.006, self.div+0.03)
        self.tte = random.uniform(8, 50) / 365
        # use smallest strike rc to avoid negative puts
        self.rc = self.strikes[0] * (1 - np.exp(-self.r * self.tte)) - self.stock * (
            1 - np.exp(-self.div * self.tte)
        )
        self.rc = round(self.rc, 2)
        self.sigma = random.uniform(20, 40) / self.stock

    def round(self, num):
        return int(num) if float(num).is_integer() else round(num * 2)/2

    def get_options(self, stock=None):
        if stock is None:
            stock = self.stock
        self.calls = [
            round(BS_CALL(stock, k, self.tte, self.r, self.div, self.sigma), 2)
            for k in self.strikes
        ]
        self.puts = [
            -(stock - self.strikes[i]) + self.calls[i] - self.rc
            for i in range(len(self.strikes))
        ]
        self.bw = self.puts[0] + self.rc
        self.pns = self.calls[-1] - self.rc
        return self.calls, self.puts

    def random_walk(self):
        logret = random.gauss(0, self.sigma/64)
        self.stock = self.stock * np.exp(logret)

    def stock_to_ins(self, side, price, ins, strike1=None, strike2=None):
        if ins == "call":
            return side, price - self.strikes[0] + self.bw
        elif ins == "put":
            return -side, -(price - self.strikes[-1]) + self.pns
        elif ins == "combo":
            return side, price - strike1 + self.rc
        elif ins == "p.o. combo":
            return -side, -(price - strike1 + self.rc)
        elif ins == "risk reversal":
            i = int((strike1 - self.strikes[0]) / self.STRIKE_INC)
            j = int((strike2 - self.strikes[0]) / self.STRIKE_INC)
            cs = self.calls[i] - self.calls[j]
            combo = price - strike1 + self.rc
            return side, cs - combo
        elif ins == "c.o. risk reversal":
            side, theo = self.stock_to_ins(side, price, "risk reversal", strike1, strike2)
            return -side, -theo

    def ins_to_stock(self, price, ins, strike1=None, strike2=None):
        # to convert quotes into stock
        if ins == "call":
            return price + self.strikes[0] - self.bw
        elif ins == "put":
            return self.strikes[-1] - (price - self.pns)
        elif ins == "combo":
            return price - self.rc + strike1
        elif ins == "p.o. combo":
            return self.ins_to_stock(-price, "combo", strike1)
        elif ins == "risk reversal":
            i = int((strike1 - self.strikes[0]) / self.STRIKE_INC)
            j = int((strike2 - self.strikes[0]) / self.STRIKE_INC)
            cs = self.calls[i] - self.calls[j]
            return cs - price - self.rc + strike1
        elif ins == "c.o. risk reversal":
            return self.ins_to_stock(-price, "risk reversal", strike1, strike2)

    def ins_to_text(self, ins, strike1=None, strike2=None):
        strike1 = f"{int(strike1)}" if float(strike1).is_integer() else f"{strike1:.1f}"
        if ins == "call":
            return f"{self.strikes[0]} call"
        elif ins == "put":
            return f"{self.strikes[-1]} put"
        elif "combo" in ins:
            return f"{strike1} {ins}"
        elif "risk" in ins:
            return f"{strike1}/{strike2} {ins}"

    def choose_ins(self, ref=None):
        if ref is None:
            ref = self.stock
        ins = random.choices(["combo", "call", "put", "risk reversal"], weights=[2, 1, 1, 1])[0]
        strike = self.strikes[0]
        strike2 = self.strikes[-1]
        if ins == "combo":
            strike = random.choice(self.strikes)
            if ref - strike + self.rc < 0:
                ins = "p.o. combo"
        elif ins == "put":
            strike = self.strikes[-1]
        elif ins == "risk reversal":
            strikes = sorted(random.sample(self.strikes[1:4], 2))
            strike, strike2 = strikes[0], strikes[1]
            instext = self.ins_to_text(ins, strike, strike2)
            side, theo = self.stock_to_ins(1, ref, ins, strike, strike2)
            if theo < 0:
                ins = "c.o. risk reversal"

        return ins, self.round(strike), self.round(strike2)
