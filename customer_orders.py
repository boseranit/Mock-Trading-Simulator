from generate_stock import StockProperties
from market_maker import MarketMaker
import random

class CustomerOrders:
    def __init__(self, stockinfo : StockProperties, mm : MarketMaker):
        self.stockinfo = stockinfo
        self.mm = mm
        self.orders = []
        self.P = 0.5 # probability of informed customer
    
    def generate_order(self):
        informed = random.random() < self.P
        '''
        if informed, 
            - if market maker range contains fair then buy or sell a few cents
              away from fair.
            - if market maker range outside fair then place order in direction
              of fair up to at most mm.edge away from their quotes
        if not informed
            - choose buy or sell with even distribution
            - if buy, uniformly choose price [bid, offer + edge]
            - if sell, uniformly choose price [bid - edge, offer]
        This is to match the behaviour of informed orders, so that they can't be
        determined solely based on the price.
        '''

