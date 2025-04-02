class CustomerOrders {
    constructor(stockinfo, mm) {
        this.stockinfo = stockinfo;
        this.mm = mm;
        this.orders = {};  // (ins, strike, side) : (price, size)
        this.P = 0.5;  // probability of informed customer
        this.Pmarket = 0.5;  // probability of making market before customer order
    }

    getDigitsPrefix(text) {
        const match = text.match(/^[\d.]+/);
        return match ? match[0] : '';
    }

    generateOrder(quote = null) {
        const informed = Math.random() < this.P;
        const edge = Math.random() * 80;  // mean 1/80
        let fair = this.stockinfo.stock;

        if (!informed) {
            fair = Math.random() * (this.mm.mid + this.mm.width) - this.mm.width;
        }

        let bid = this.mm.bid, ask = this.mm.offer;
        if (quote !== null) {
            [bid, ask] = quote;
        }

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

    parseAction(action) {
        if (action.includes("done")) {
            this.nextStep();
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
                document.getElementById("print-quote").innerText = `Traded ${size}x ${custText} at ${price}`;
                delete this.orders[key];
            } else {
                document.getElementById("print-quote").innerText = `${custText} not found`;
                console.log(this.orders);
            }
        }
    }

    nextStep() {
        const printArea = document.getElementById("print-board");

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

        const [ins, strike] = this.stockinfo.choose_ins(this.mm.mid);
        const size = this.mm.DEFAULT_SZ * Math.floor(Math.random() * 13 + 1);
        const instext = this.stockinfo.insToText(ins, strike);
        let quote = null;
        let stockquote = null;

        if (Math.random() < this.Pmarket) {
            printArea.innerHTML += `Make a market in ${instext} ${size}x\n`;
            quote = prompt("Enter quote for market (bid offer):").split(" ").map(parseFloat);
            stockquote = quote.map(p => this.stockinfo.insToStock(p, ins, strike));
            stockquote = stockquote.sort();
            printArea.innerHTML += `implied stock ${stockquote}\n`;  // TODO: remove after testing
        }

        let [s, price] = this.generateOrder(stockquote);
        printArea.innerHTML += `(stock ${s} ${price}`;
        [s, price] = this.stockinfo.stockToIns(s, price, ins, strike);
        printArea.innerHTML += `${instext} ${s} ${price})\n`;

        const side = s === 1 ? "bid" : "offer";
        if (quote !== null && side === "bid" && price >= quote[1]) {
            printArea.innerHTML += `Cust buys at ${quote[1]}\n`;
        } else if (quote !== null && side === "offer" && price <= quote[0]) {
            printArea.innerHTML += `Cust sells at ${quote[0]}\n`;
        } else {
            printArea.innerHTML += `${instext} ${size}x cust ${side}s ${price.toFixed(2)}\n`;
            const key = [ins, strike, s].toString();
            if (this.orders[key]) {
                const [oldPrice, _] = this.orders[key];
                this.orders[key] = [Math.max(s * oldPrice, s * price), size];
            } else {
                this.orders[key] = [price, size];
            }
        }
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

