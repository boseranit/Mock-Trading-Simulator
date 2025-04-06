// Include the StockProperties class code here
// Black-Scholes formula for call options
function BS_CALL(S, K, T, r, q, sigma) {
  const d1 = (Math.log(S / K) + (r - q + sigma**2 / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return S * Math.exp(-q * T) * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
}

// Black-Scholes formula for put options
function BS_PUT(S, K, T, r, q, sigma) {
  const d1 = (Math.log(S / K) + (r - q + sigma**2 / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return K * Math.exp(-r * T) * normCDF(-d2) - S * Math.exp(-q * T) * normCDF(-d1);
}

class StockProperties {
  constructor() {
	// Choose a random strike increment
	this.STRIKE_INC = [5, 5, 2.5][Math.floor(Math.random() * 3)];
	
	const MIN_STRIKE = 20;
	const MAX_STRIKE = 90;
	
	// Generate first strike randomly between MIN_STRIKE and MAX_STRIKE
	this.strikes = [MIN_STRIKE + Math.floor(Math.random() * ((MAX_STRIKE - MIN_STRIKE) / 5 + 1)) * 5];
	
	// Generate remaining strikes
	for (let i = 0; i < 4; i++) {
	  this.strikes.push(this.strikes[this.strikes.length - 1] + this.STRIKE_INC);
	}
	
	// Generate stock price
	this.stock = this.strikes[2] + Math.round((Math.random() * 8 - 3) * 100) / 100;
	
	// Interest rate and dividend yield
	this.div = Math.random() * 0.03;
	this.r = Math.random() * 0.03 + this.div + 0.006;
	
	// Time to expiration in years
	this.tte = (Math.random() * 42 + 8) / 365;
	
	// Calculate risk correction
	this.rc = this.strikes[0] * (1 - Math.exp(-this.r * this.tte)) - this.stock * (
	  1 - Math.exp(-this.div * this.tte)
	);
	this.rc = Math.round(this.rc * 100) / 100;
	
	// Volatility
	this.sigma = (Math.random() * 20 + 20) / this.stock;
  }
  
  // Get option prices for calls and puts
  get_options(stock = null) {
	if (stock === null) {
	  stock = this.stock;
	}
	
	this.calls = this.strikes.map(k => 
	  Math.round(BS_CALL(stock, k, this.tte, this.r, this.div, this.sigma) * 100) / 100
	);
	
	this.puts = this.strikes.map((_, i) => 
	  -(stock - this.strikes[i]) + this.calls[i] - this.rc
	);
	
	this.bw = this.puts[0] + this.rc;
	this.pns = this.calls[this.calls.length - 1] - this.rc;
	
	return [this.calls, this.puts];
  }
  
  // Simulate stock price change
  random_walk() {
	const logret = randomNormal(0, self.sigma/64)
	this.stock = this.stock * Math.exp(logret);
	return Math.round(this.stock * 100) / 100;
  }
  
  // Convert from stock price to instrument price
  stockToIns(side, price, ins, strike1 = null) {
	if (ins === "call") {
	  return [side, price - this.strikes[0] + this.bw];
	} else if (ins === "put") {
	  return [-side, -(price - this.strikes[this.strikes.length - 1]) + this.pns];
	} else if (ins === "combo") {
	  return [side, price - strike1 + this.rc];
	} else if (ins === "p.o. combo") {
	  return [-side, -(price - strike1 + this.rc)];
	}
	return [side, price]; // Default fallback
  }
  
  // Convert from instrument price to stock price
  insToStock(price, ins, strike1 = null) {
	if (ins === "call") {
	  return price + this.strikes[0] - this.bw;
	} else if (ins === "put") {
	  return this.strikes[this.strikes.length - 1] - (price - this.pns);
	} else if (ins === "combo") {
	  return price - this.rc + strike1;
	} else if (ins === "p.o. combo") {
	  return this.insToStock(-price, "combo", strike1);
	}
	return price; // Default fallback
  }
  
  // Get text description of an instrument
  insToText(ins, strike1 = null) {
	let strikeText;
	if (strike1 !== null) {
	  strikeText = Number.isInteger(parseFloat(strike1)) ? 
		`${parseInt(strike1)}` : 
		`${parseFloat(strike1).toFixed(1)}`;
	}
	
	if (ins === "call") {
	  return `${this.strikes[0]} call`;
	} else if (ins === "put") {
	  return `${this.strikes[this.strikes.length - 1]} put`;
	} else if (ins.includes("combo")) {
	  return `${strikeText} ${ins}`;
	}
	return ins; // Default fallback
  }
  
  // Choose a random instrument
  choose_ins(ref = null) {
	if (ref === null) {
	  ref = this.stock;
	}
	
	// Weighted random choice
	const rand = Math.random();
	let ins;
	
	if (rand < 5/7) {
	  ins = "combo";
	} else if (rand < 6/7) {
	  ins = "call";
	} else {
	  ins = "put";
	}
	
	let strike = this.strikes[0];
	
	if (ins === "combo") {
	  strike = this.strikes[Math.floor(Math.random() * this.strikes.length)];
	  if (strike > ref) {
		ins = "p.o. combo";
	  }
	} else if (ins === "put") {
	  strike = this.strikes[this.strikes.length - 1];
	}
	
	return [ins, Math.round(parseFloat(strike) * 10) / 10];
  }
}


