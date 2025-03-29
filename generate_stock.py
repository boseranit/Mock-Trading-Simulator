import numpy as np
from scipy.stats import norm
import random
import pandas as pd


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
        STRIKE_INC = random.choice([5, 5, 2.5])
        MIN_STRIKE = 20
        MAX_STRIKE = 90
        self.strikes = [random.randrange(MIN_STRIKE, MAX_STRIKE + 1, 5)]
        for i in range(4):
            self.strikes.append(self.strikes[-1] + STRIKE_INC)
        self.stock = self.strikes[2] + round(random.uniform(-3, 5), 2)

        self.r = random.uniform(0.03, 0.06)
        self.div = random.uniform(0, 0.03)
        self.tte = random.uniform(8, 50) / 365
        # use smallest strike rc to avoid negative puts
        self.rc = self.strikes[0] * (1 - np.exp(-self.r * self.tte)) - self.stock * (
            1 - np.exp(-self.div * self.tte)
        )
        self.rc = round(self.rc, 2)
        self.sigma = random.uniform(20, 40) / self.stock

    def get_options(self):
        self.calls = [
            round(BS_CALL(self.stock, k, self.tte, self.r, self.div, self.sigma), 2)
            for k in self.strikes
        ]
        self.puts = [
            -(self.stock - self.strikes[i]) + calls[i] - self.rc
            for i in range(len(self.strikes))
        ]
        self.bw = self.puts[0] + self.rc
        self.pns = self.calls[-1] - self.rc
        return self.calls, self.puts

    def random_walk(self):
        logret = random.gauss(0, self.sigma)
        self.stock = self.stock * np.exp(logret)

    def stock_to_ins(self, price, ins, strike1=None):
        if ins == "call":
            return price - self.strike[0] + self.bw
        elif ins == "put":
            return -(price - self.strike[-1]) + self.pns
        elif ins == "combo":
            return price - strike1 + self.rc

    def choose_ins(self):
        ins = random.choices(["combo", "call", "put"], weights=[5, 1, 1])
        return ins
