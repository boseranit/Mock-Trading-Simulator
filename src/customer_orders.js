class CustomerOrders {
    constructor(stockinfo, mm) {
        this.stockinfo = stockinfo;
        this.mm = mm;
        this.orders = new Map();  // (ins, strike, side) : (price, size)
        this.P = 0.5;  // probability of informed customer
        this.Pmarket = 0.6;  // probability of making market before customer order
		this.state = "new ins" // "quote pending", "new ins"
    }

    getDigitsPrefix(text) {
        const match = text.match(/^[\d.]+/);
        return match ? match[0] : '';
    }

	getSecondBestBidAsk() {
	  const buyPrices = [];
	  const sellPrices = [];

	  for (const [key, value] of this.orders) {
		// side = key[2], price = value[0]
		if (key[2] === 1) {
		  buyPrices.push(value[0]);
		} else if (key[2] === -1) {
		  sellPrices.push(value[0]);
		}
	  }

	  buyPrices.sort((a, b) => b - a); // Highest first
	  sellPrices.sort((a, b) => a - b); // Lowest first

	  const secondBestBid = buyPrices[1] ?? 0;   
  	  const secondBestAsk = sellPrices[1] ?? 1e6; 
	  return [ secondBestBid, secondBestAsk ];
	}

    generateOrder(quote = null) {
        const informed = Math.random() < this.P;
        const edge = randomExpo(80);  // mean 1/80
        let fair = this.stockinfo.stock;

        if (!informed) {
            fair = randomNormal(this.mm.mid, this.mm.width);
        }
		document.getElementById("responseText").textContent += `fair = ${fair}, edge = ${edge}`

        let bid = this.mm.bid, ask = this.mm.offer;
		quote = quote ?? [bid, ask];

        let side = Math.random() < 0.5 ? -1 : 1;
        let price = null;

        if (bid <= fair && fair <= ask) {
            price = fair - side * edge;
        } else if (fair > ask) {
            side = 1;
            price = Math.random() * (ask + this.mm.edge - ask) + (ask + 0.01);
        } else if (fair < bid) {
            side = -1;
            price = Math.random() * (bid - this.mm.edge - bid) + (bid - 0.01);
        }

        return [side, price];
    }

	generateGoodOrder(quote = null) {
		// ensures that generated order beats second best bid or ask
		const [bb, bo] = this.getSecondBestBidAsk();
		let side = 1, price = -1;
		while ((side === 1 && price < bb) || (side === -1 && price > bo)) {
			[side, price] = this.generateOrder(quote);
		}
		return [side, price]
	}

    parseAction(action) {
        if (action === "") {
            this.nextStep();
            return;
        }
		if (this.state === "market pending") {
			const [bid, ask] = action.split(" ").map(parseFloat);
			this.processQuote([bid, ask]);
			return;
		}

        if (action.endsWith("k")) {
            const [side, priceStr, sizeStr] = action.split(" ");
            const price = parseFloat(priceStr);
            const size = parseInt(sizeStr.slice(0, -1)) * 10;
            const newquote = this.mm.trade(side, price, size);
            document.getElementById("print-quote").innerText = newquote;
        } else {
            const [side, strikeStr, ins] = action.split(" ", 3);
            const strike = Math.round(parseFloat(this.getDigitsPrefix(strikeStr)), 1);
            const sideText = side === "buy" ? "offer" : "bid";
            const s = sideText === "offer" ? -1 : 1;
            const custText = `${this.stockinfo.insToText(ins, strike)} ${sideText}`;

            const key = [ins, strike, s].toString();
            if (this.orders[key]) {
                const [price, size] = this.orders[key];
                document.getElementById("responseText").textContent = `Traded ${size}x ${custText} at ${price}`;
                delete this.orders[key];
            } else {
				document.getElementById("responseText").textContent = `${custText} not found`;
                console.log(this.orders);
            }
        }
    }

	addRestingOrder(ins, strike, side, price, size) {
		if (Object.keys(this.orders).length > 0) {
            printArea.innerHTML = "Resting orders:\n";
            for (const key in this.orders) {
                const [ins, strike, side] = key.split(",");
                const [price, size] = this.orders[key];
                const sideText = side === "1" ? "bid" : "offer";
                printArea.innerHTML += `${this.stockinfo.insToText(ins, strike)} ${size}x ${sideText} ${price.toFixed(2)}\n`;
            }
            printArea.innerHTML += "\n";
        }
		return;
	}

	processQuote(quote) {
		const [ins, strike, size] = this.selected_ins;
    	let stockquote = null;
		stockquote = quote.map(p => this.stockinfo.insToStock(p, ins, strike));
        stockquote = stockquote.sort();
        document.getElementById("responseText").textContent = `implied stock ${stockquote}`;  // TODO: remove after testing

		this.state = "new order";
		this.nextStep(quote, stockquote);
	}

    nextStep(quote=null, stockquote=null) {
        const printArea = document.getElementById("prompt");
        const responseArea = document.getElementById("responseText");

		if (this.state === "market pending") {
			responseArea.textContent = "enter your market";
			return;
		}
		
		if (this.state === "new ins") {
			const [ins, strike] = this.stockinfo.choose_ins(this.mm.mid);
			const size = this.mm.DEFAULT_SZ * Math.floor(Math.random() * 13 + 1);
			const instext = this.stockinfo.insToText(ins, strike);
			this.selected_ins = [ins, strike, size]

			if (Math.random() < this.Pmarket) {
				printArea.innerHTML = `Make a market in ${instext} ${size}x\n`;
				this.state = "market pending";
				return;
			}
		}
        // state here is "new order" either with or without quote

		const [ins, strike, size] = this.selected_ins;
		const instext = this.stockinfo.insToText(ins, strike);
        let [s, price] = this.generateGoodOrder(stockquote);
        responseArea.textContent += `(stock ${s} ${price})\n`;
        [s, price] = this.stockinfo.stockToIns(s, price, ins, strike);
        responseArea.textContent += `${instext} ${s} ${price})\n`;

        const side = s === 1 ? "bid" : "offer";
        if (quote !== null && side === "bid" && price >= quote[1]) {
            printArea.innerHTML = `Cust buys at ${quote[1]}\n`;
        } else if (quote !== null && side === "offer" && price <= quote[0]) {
            printArea.innerHTML = `Cust sells at ${quote[0]}\n`;
        } else {
            printArea.innerHTML = `${instext} ${size}x cust ${side}s ${price.toFixed(2)}\n`;
            const key = [ins, strike, s].toString();
            if (this.orders[key]) {
                const [oldPrice, _] = this.orders[key];
                this.orders[key] = [Math.max(s * oldPrice, s * price), size];
            } else {
                this.orders[key] = [price, size];
            }
        }
		// update resting orders table
		this.state = "new ins";
    }

    start() {
        const printArea = document.getElementById("print-quote");
        printArea.innerText = this.mm.quote();
        this.nextStep();

        const userInputField = document.getElementById("user-input");
        userInputField.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const action = userInputField.value;
                if (action.includes("quit")) {
                    return;
                }
                this.parseAction(action);
                userInputField.value = "";
            }
        });
    }
}

