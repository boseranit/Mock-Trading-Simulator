class MockBoard {
	constructor(stockinfo, stock = null, quote = null) {
		this.stockinfo = stockinfo;
		this.stock = stock || this.stockinfo.stock;
		this.quote = quote;
	}

	print_board() {
		const stock = this.stock;
		const rc = this.stockinfo.rc;
		const strikes = this.stockinfo.strikes;
		const [calls, puts] = this.stockinfo.get_options(stock);
		this.calls = calls;
		this.puts = puts;

		const output1 = document.getElementById("output1");
		const tbody = document.getElementById('optionsTable');
		tbody.innerHTML = '';
		let bw = `${strikes[0]} B/W=${(puts[0] + rc).toFixed(2)}`;
		let ps = `${strikes[1]}/${strikes[2]} PS=${(puts[2] - puts[1]).toFixed(2)}`;
		let strad = `${strikes[2]} ∀=${(calls[2] + puts[2]).toFixed(2)}`;
		let cs = `${strikes[2]}/${strikes[3]} CS=${(calls[2] - calls[3]).toFixed(2)}`;
		let pns = `${strikes[4]} P+S=${(calls[4] - rc).toFixed(2)}`;
		const rows = [["","","","",strikes[0],"","","",bw],
					 ["","","","",strikes[1],"","","",ps],
					 [cs,"","","",strikes[2],"","","",strad],
					 ["","","","",strikes[3],"","","",""],
			         [pns,"","","",strikes[4],"","","",""]];

		rows.forEach(values => {
			const row = document.createElement("tr");
			values.forEach( value => {
				const cell = document.createElement("td");
				cell.textContent = value; // Set cell content
    		    row.appendChild(cell);	
			});
			tbody.appendChild(row);
		});
	}

	show_theos() {
		const tbody = document.getElementById('optionsTable');
		const rows = tbody.rows;
		for (let i = 0; i < 5; i++) {
			const row = rows[i];
			const callcell = row.cells[2];
			const putcell = row.cells[6];
			callcell.textContent = this.calls[i].toFixed(2);
			putcell.textContent = this.puts[i].toFixed(2);
		}
	}

	hide_theos() {
		const tbody = document.getElementById('optionsTable');
		const rows = tbody.rows;
		for (let i = 0; i < 5; i++) {
			const row = rows[i];
			const callcell = row.cells[2];
			const putcell = row.cells[6];
			callcell.textContent = "";
			putcell.textContent = "";
		}
	}

	make_markets() {
		const stock = this.stock;
		const rc = this.stockinfo.rc;
		const strikes = this.stockinfo.strikes;
		const [calls, puts] = this.stockinfo.get_options(stock);
		const output1 = document.getElementById("output1");
		const inputBox = document.getElementById("inputBox");

		output1.innerHTML = "Press enter to make markets...";

		inputBox.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				let action = inputBox.value;
				if (action === "q") return;

				let k = strikes[Math.floor(Math.random() * strikes.length)];
				let i = Math.floor(Math.random() * 4);
				let fair = 0;
				let ins = "";

				if (Math.random() < 0.5) {
					fair = Math.abs(stock - k + rc);
					output1.innerHTML = `Make a market in ${k} combos`;
				} else {
					ins = ["RR", "CS", "PS"][Math.floor(Math.random() * 3)];
					output1.innerHTML = `Make a market in ${strikes[i]}/${strikes[i + 1]} ${ins}`;
					if (ins === "RR") {
						fair = Math.abs(puts[i] - calls[i + 1]);
					} else if (ins === "CS") {
						fair = calls[i] - calls[i + 1];
					} else if (ins === "PS") {
						fair = puts[i + 1] - puts[i];
					}
				}
				output1.innerHTML += `<br>fair price = ${fair.toFixed(2)}`;
			}
		});
	}
}

