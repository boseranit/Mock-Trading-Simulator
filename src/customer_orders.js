class CustomerOrders {
    constructor(stockinfo, mm) {
        this.stockinfo = stockinfo;
        this.mm = mm;
        this.orders = new Set();  // (ins, strike, side, price, size) 
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
		document.getElementById("responseText").textContent += `fair = ${fair}, edge = ${edge}`;

        let bid = this.mm.bid, ask = this.mm.offer;
		if (quote !== null) { // prefer user market
            [bid, ask] = quote;
        }

        let side = fair > (bid + ask)/2 ? 1 : -1;
        let price = null;

        if (bid <= fair && fair <= ask) {
            price = fair - side * edge;
        } else if (fair > ask) {
            side = 1;
            price = randomUniform(ask + 0.01, ask + this.mm.edge);
        } else if (fair < bid) {
            side = -1;
            price = randomUniform(bid - this.mm.edge, bid - 0.01);
        }

        return [side, price];
    }

	generateGoodOrder(quote = null) {
		// ensures that generated order beats second best bid or ask
		let [bb, bo] = this.getSecondBestBidAsk();
		if (quote !== null) {
			const mid = (quote[0]+quote[1])/2;
			bb = Math.max(bb, mid);
			bo = Math.min(bo, mid);
		}
		let side = 1, price = -1;
		while ((side === 1 && price < bb + 0.01) || (side === -1 && price > bo - 0.01)) {
			[side, price] = this.generateOrder(quote);
		}
		console.log(this.orders);
		console.log("2nd bb bo ", bb, bo);
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
            console.log("Invalid action");
            
        }
    }

	addRestingOrder(ins, strike, s, price, size) {
		const key = [ins, strike, s, price, size].toString();
        const side = s === 1 ? "bid" : "offer";
		if (this.orders.has(key)) {
			// remove old order
			return;
		} 
		this.orders.add(key);

		// Create text description for display
		const instext = this.stockinfo.insToText(ins, strike);
		
		// Create the new list item element
		const li = document.createElement('li');
		const span = document.createElement('span');
		span.className = 'item-text';
		span.textContent = `${instext} ${size}x cust ${side}s ${price.toFixed(2)}\n`;
		
		// Create and set up the button
		const button = document.createElement('button');
		button.className = 'item-button';
		button.textContent = s==1 ? 'Sell' : 'Buy';
		button.onclick = (event) => {
		  // Navigate up from the button to the parent li element
		  const listItem = event.target.closest('li');
		  
		  // Get the orderKey from the li's dataset
		  this.fillOrder(event.target, listItem.dataset.orderKey);
		};	
		// Store the key as a data attribute for easy access when removing
		li.dataset.orderKey = key;
		
		// Append the elements to the list item
		li.appendChild(span);
		li.appendChild(button);
		
		// Add the new list item to the itemsList
		document.getElementById('restingOrders').appendChild(li);
		
		return li;
	}

	// Function to remove item from resting orders list and the Map
	fillOrder(button, key) {
		// Remove from the orders Map
		if (this.orders.has(key)) {
			this.orders.delete(key);
            document.getElementById("responseText").textContent = `Traded ${key}`;
		} else {
			document.getElementById("responseText").textContent = `${key} not found`;
			console.log(this.orders);
		}
		// Find the matching list item using the data attribute
		const itemsList = document.getElementById('restingOrders');
		const items = itemsList.querySelectorAll('li');
		
		for (const item of items) {
			if (item.dataset.orderKey === key) {
				// itemsList.removeChild(item);
			}
		}
		/*
		// identify button based on the key and update button
		const listItem = document.querySelector(`li[data-order-key="${key}"]`);
		if (!listItem) {
			console.error(`No list item found with key: ${key}`);
			return;
		}
		
		// Find the text element and button within this list item
		const textElement = listItem.querySelector('.item-text');
		const button = listItem.querySelector('.item-button');	
		*/
		
		// Toggle button color
		button.classList.toggle('active');
		
		if (button.classList.contains('active')) {
			//textElement.textContent = textElement.textContent + " T";
			button.textContent = "Traded";
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
			this.addRestingOrder(ins, strike, s, price, size)
            
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

