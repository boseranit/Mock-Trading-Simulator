// Page initialization and event handlers
document.addEventListener('DOMContentLoaded', function() {
	let stockProps = new StockProperties();
	let mm = new MarketMaker(stockProps);
	let cust = new CustomerOrders(stockProps, mm);
	let board = new MockBoard(stockProps, mm.mid, mm.quote());
	board.print_board();

	const printArea = document.getElementById("print-quote");
	const rcArea = document.getElementById("rc");

	function updateStock() {
		printArea.textContent = mm.quote();
		rc.textContent = `r/c = ${stockProps.rc.toFixed(2)}`;
	};

	updateStock();
	
	const table = document.getElementById('optionsTable');
	// Make only bid and ask columns editable 
    table.querySelectorAll('td').forEach((td, index) => {
        const colIndex = index % 9;
        if (colIndex === 1 || colIndex === 3 || colIndex === 5 || colIndex === 7) { 
            td.setAttribute('contenteditable', 'true');
            td.setAttribute('tabindex', '0');
        } else {
            td.setAttribute('contenteditable', 'false');
            td.setAttribute('tabindex', '-1');
        }
    });
	// Add tab navigation logic
	table.addEventListener('keydown', (e) => {
		if (e.key === 'Tab' && !e.shiftKey) {
			e.preventDefault();
			const cell = e.target;
			const row = cell.parentElement;
			const tbody = row.parentElement;
			
			const currentRowIdx = Array.from(tbody.rows).indexOf(row);
			const currentColIdx = Array.from(row.cells).indexOf(cell);
			const totalRows = tbody.rows.length;

			let nextRowIdx, nextColIdx;

			// Navigation logic
			if (currentColIdx === 1) {  // Column 1
				nextRowIdx = currentRowIdx;
				nextColIdx = 3;
			} else if (currentColIdx === 3) {  // Column 2
				if (currentRowIdx < totalRows - 1) {
					nextRowIdx = currentRowIdx + 1;
					nextColIdx = 1;
				} else {
					nextRowIdx = 0;
					nextColIdx = 5;
				}
			} else if (currentColIdx === 5) {  // Column 3
				nextRowIdx = currentRowIdx;
				nextColIdx = 7;
			} else if (currentColIdx === 7) {  // Column 4
				if (currentRowIdx < totalRows - 1) {
					nextRowIdx = currentRowIdx + 1;
					nextColIdx = 5;
				} else {
					nextRowIdx = 0;
					nextColIdx = 1;
				}
			}

			// Wrap around if needed and focus
			const nextRow = tbody.rows[nextRowIdx % totalRows];
			const nextCell = nextRow.cells[nextColIdx];
			nextCell.focus();
		}
	});
	
	// toggle option theos
  	const toggleButton = document.getElementById("theosToggle");
	let pricesCurrentlyVisible = false;
	toggleButton.addEventListener('click', () => {
		if (pricesCurrentlyVisible) {
		  // Prices are visible -> Hide them
		  board.hide_theos();
		  toggleButton.textContent = 'Show theos'; // Update button text
		  toggleButton.setAttribute('aria-pressed', 'false'); // Update accessibility state
		  pricesCurrentlyVisible = false; // Update state variable
		} else {
		  // Prices are hidden -> Show them
		  board.show_theos();
		  toggleButton.textContent = 'Hide theos'; // Update button text
		  toggleButton.setAttribute('aria-pressed', 'true'); // Update accessibility state
		  pricesCurrentlyVisible = true; // Update state variable
		}
	});

    const userInputField = document.getElementById("user-input");
    userInputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const action = userInputField.value;
            cust.parseAction(action);
            userInputField.value = "";
        }
    });	

	const nextStepButton = document.getElementById("next-step-button");
	nextStepButton.addEventListener('click', () => {
		cust.nextStep();
	});

	// Generate new stock button
	document.getElementById('generateNew').addEventListener('click', function() {
		stockProps = new StockProperties();
		mm = new MarketMaker(stockProps);
		cust = new CustomerOrders(stockProps, mm);
		board = new MockBoard(stockProps, mm.mid, mm.quote());
		board.print_board();
		updateStock();

	});
	
	
	
});
