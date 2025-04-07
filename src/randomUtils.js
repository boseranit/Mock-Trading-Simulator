function normCDF(x, mean = 0, stddev = 1) {
  return jStat.normal.cdf(x, mean, stddev);
}

function randomUniform(low = 0, high = 1) {
	return Math.random() * (high - low) + low;
}

function randomTriangular(low = 0, high = 1, mode) {
  const finalMode = (mode === undefined || mode === null) ? (low + high) / 2 : mode;

  // Validate parameters
  if (low > high) {
    [low, high] = [high, low];
  }
  if (finalMode < low || finalMode > high) {
    finalMode = (low + high) / 2;
  }

  const u = Math.random();

  // Calculate the cumulative probability at the mode.
  // This determines which side of the triangle the random number will fall on.
  const fc = (finalMode - low) / (high - low);

  // Apply the inverse transform sampling formula
  if (u < fc) {
    // Case 1: The random number falls between low and mode (left side of triangle)
    // Solve U = (x-a)² / ((b-a)*(c-a)) for x
    return low + Math.sqrt(u * (high - low) * (finalMode - low));
  } else {
    // Case 2: The random number falls between mode and high (right side of triangle)
    // Solve U = 1 - (b-x)² / ((b-a)*(b-c)) for x
    return high - Math.sqrt((1 - u) * (high - low) * (high - finalMode));
  }
}

function randomNormal(mean = 0, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();

  // Box-Muller transform
  let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Scale and shift
  return z0 * stdDev + mean;
}
 
function randomExpo(lambda = 1.0) {
    if (lambda <= 0) {
        throw new Error("Lambda must be positive and nonzero");
    }
    
    // Using 1 - Math.random() to avoid the extremely rare case of getting 0
    const u = 1 - Math.random();
    
    // Apply the inverse transform method for exponential distribution
    return -Math.log(u) / lambda;
}

function randomWeibull(alpha, beta) {
    if (alpha <= 0 || beta <= 0) {
        throw new Error("Alpha and Beta must be positive");
    }
    
    // Generate a uniform random number U in (0, 1]
    const U = 1 - Math.random();
    
    // Apply the inverse CDF of the Weibull distribution
    return alpha * Math.pow(-Math.log(U), 1 / beta);
}
