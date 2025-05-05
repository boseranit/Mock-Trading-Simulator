class MarketMaker {
	constructor(stockinfo) {
		this.stockinfo = stockinfo;
		this.CONV_WIDTH = randomTriangular(0.02, 0.30, 0.10);
		this.mid = null;
		this.width = null;
		this.DEFAULT_SZ = Math.floor(Math.random() * 8 + 3) * 10; // Random size between 30 and 100
		this.adjustWidth();
	}

	adjustWidth(alpha=0.2) {
		if (this.width === null) {
			this.width = Math.max(randomWeibull(0.2, 1.5), 0.02);
		} else {
			this.width = alpha * randomTriangular(0.02, 2 * this.CONV_WIDTH - 0.02) + (1 - alpha) * this.width;
		}
		this.edge = this.width / 2;
		const newPrice = this.stockinfo.stock + randomNormal(0,this.edge * 2);
		const oldPrice = this.mid;
		const uptick = newPrice > (this.mid || 0);
		if (this.mid === null) {
			this.mid = this.stockinfo.stock + (Math.random() > 0.5 ? 1 : -1) * randomNormal(3 * this.edge, this.edge);
		} else {
			this.mid = alpha * newPrice + (1 - alpha) * this.mid;
			this.mid = Math.max(this.mid, oldPrice - this.edge);
			this.mid = Math.min(this.mid, oldPrice + this.edge);
		}
		this.impact = this.width * 10;
		return uptick;
	}

	formatQuote(bid, bs, offer, os) {
		return `Stock: ${bid.toFixed(2)}/${bs} @ ${offer.toFixed(2)}/${os}`;
	}

	quote(b = 1, o = 1) {
		this.bid = this.mid - this.edge;
		this.offer = this.mid + this.edge;
		this.bidsize = Math.round(this.DEFAULT_SZ * b / 10) * 10;
		this.offersize = Math.round(this.DEFAULT_SZ * o / 10) * 10;
		return this.formatQuote(this.bid, this.bidsize, this.offer, this.offersize);
	}

	trade(side, price, size) {
		const printArea = document.getElementById("responseText");

		// print the trade information
		printArea.textContent = `side: ${side}  price: ${price}  size: ${size}`;

		const relSize = size / this.DEFAULT_SZ;
		const alpha = normCDF(relSize, 2, 1.5);
		price = Math.min(price, this.mid + relSize * this.edge);
		price = Math.max(price, this.mid - relSize * this.edge);

		if ((side === "buy" && price > this.mid) || (side === "sell" && price < this.mid)) {
			this.mid = alpha * price + (1 - alpha) * this.mid;
		}

		const oldFair = this.mid;
		const uptick = this.adjustWidth(relSize / 15);
		if (side === "buy" && price > oldFair) {
			this.mid = Math.max(oldFair, this.mid);
		} else if (side === "sell" && price < oldFair) {
			this.mid = Math.min(oldFair, this.mid);
		}

		let b = 1, o = 1;
		const rng = Math.random();
		if (uptick) {
			if (side === "buy" && rng < 0.5) o = 0.5;
			if (side === "sell" && rng < 0.5) b = 2;
		} else {
			if (side === "sell" && rng < 0.5) b = 0.5;
			if (side === "buy" && rng < 0.5) o = 2;
		}

		const newquote = this.quote(b, o)
        document.getElementById("print-quote").innerText = newquote;
		return newquote;
	}
}
