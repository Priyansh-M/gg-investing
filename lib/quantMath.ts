// lib/quantMath.ts

export function calculatePortfolioRisk(holdings: any[]) {
  if (!holdings || holdings.length === 0) {
    return { beta: 1.0, sharpe: 0.0 }
  }

  // 1. Calculate Portfolio Beta
  // In a real app, you fetch historical variances. Here we simulate it based on tech/crypto heaviness.
  let totalValue = 0
  let weightedBetaSum = 0

  holdings.forEach(h => {
    const value = h.quantity * h.average_buy_price
    totalValue += value

    // Assign rough real-world beta estimations
    let stockBeta = 1.0 // Market average
    if (['TSLA', 'NVDA', 'COIN'].includes(h.symbol)) stockBeta = 2.0 // Highly volatile
    if (['AAPL', 'MSFT', 'GOOGL'].includes(h.symbol)) stockBeta = 1.2 // Tech volatile
    if (['KO', 'JNJ', 'WMT'].includes(h.symbol)) stockBeta = 0.6 // Defensive

    weightedBetaSum += (stockBeta * value)
  })

  const portfolioBeta = totalValue > 0 ? (weightedBetaSum / totalValue) : 1.0

  // 2. Calculate Simulated Sharpe Ratio
  // Sharpe = (Return - RiskFreeRate) / Volatility
  // We use our Beta as a proxy for volatility and assume a baseline expected return of 8%
  const riskFreeRate = 4.2
  const expectedReturn = 8.0 + ((portfolioBeta - 1) * 5) // Higher beta = assumed higher return profile
  
  // To avoid dividing by zero if beta is 0
  const proxyVolatility = Math.max(portfolioBeta * 15, 5) 
  
  const sharpeRatio = (expectedReturn - riskFreeRate) / proxyVolatility

  return {
    beta: Number(portfolioBeta.toFixed(2)),
    sharpe: Number(sharpeRatio.toFixed(2))
  }
}