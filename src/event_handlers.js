// Page initialization and event handlers
document.addEventListener('DOMContentLoaded', function() {
	let stockProps = new StockProperties();
	let mm = new MarketMaker(stockProps);
	let cust = new CustomerOrders(stockProps, mm);
	let board = new MockBoard(stockProps, mm.mid, mm.quote());
	board.print_board();

	updateDisplay(stockProps);
	const printArea = document.getElementById("print-quote");

	function updateStock() {
		printArea.textContent = mm.quote();
	};

	updateStock();
	function updateOptionsBoard(props) {
		// Update options table	
		const tableBody = document.getElementById('optionsTable');
		tableBody.innerHTML = '';
		// Calculate option prices
		const [calls, puts] = props.get_options();
		
		for (let i = 0; i < props.strikes.length; i++) {
			const row = document.createElement('tr');
			
			const strikeCell = document.createElement('td');
			strikeCell.textContent = props.strikes[i].toFixed(2);
			
			const callCell = document.createElement('td');
			callCell.textContent = calls[i].toFixed(2);
			
			const putCell = document.createElement('td');
			putCell.textContent = puts[i].toFixed(2);
			
			row.appendChild(callCell);
			row.appendChild(strikeCell);
			row.appendChild(putCell);
			
			tableBody.appendChild(row);
		}
	};
	// updateOptionsBoard(stockProps);		


    const userInputField = document.getElementById("user-input");
    userInputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const action = userInputField.value;
            if (action.includes("quit")) {
                return;
            }
            cust.parseAction(action);
            userInputField.value = "";
        }
    });	
	// Generate new stock button
	document.getElementById('generateNew').addEventListener('click', function() {
		stockProps = new StockProperties();
		updateDisplay(stockProps);
	});
	
	// Random walk button
	document.getElementById('randomWalk').addEventListener('click', function() {
		stockProps.random_walk();
		updateDisplay(stockProps);
	});
	
	// Update price button
	document.getElementById('updatePrice').addEventListener('click', function() {
		const newPrice = parseFloat(document.getElementById('stockPrice').value);
		if (!isNaN(newPrice) && newPrice > 0) {
			stockProps.stock = newPrice;
			updateDisplay(stockProps);
		}
	});
	
	// Choose instrument button
	document.getElementById('chooseInstrument').addEventListener('click', function() {
		const [ins, strike] = stockProps.choose_ins();
		document.getElementById('selectedInstrument').textContent = ins;
		document.getElementById('instrumentDescription').textContent = stockProps.insToText(ins, strike);
		
		// Calculate instrument price
		const [side, price] = stockProps.stockToIns(1, stockProps.stock, ins, strike);
		document.getElementById('instrumentPrice').textContent = price.toFixed(2);
	});
	
	function updateDisplay(props) {
		// Update stock info display
		document.getElementById('currentPrice').textContent = props.stock.toFixed(2);
		document.getElementById('riskFreeRate').textContent = (props.r * 100).toFixed(2);
		document.getElementById('dividendYield').textContent = (props.div * 100).toFixed(2);
		document.getElementById('daysToExpiration').textContent = Math.round(props.tte * 365);
		document.getElementById('volatility').textContent = (props.sigma * props.stock * 100).toFixed(2);
		
		
		
		// Clear the instrument selection when stock changes
		document.getElementById('selectedInstrument').textContent = '';
		document.getElementById('instrumentDescription').textContent = '';
		document.getElementById('instrumentPrice').textContent = '';
	}
});
