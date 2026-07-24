if(!sessionStorage.getItem("authenticated") && document.title !== "Welcome to Vinnie's World!"){
    alert("You are not authorized to access this page. Redirecting to home.");
    location.href = "index.html";
}


// integrating text to speech
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.maxAlternatives = 1;

const CORRECT_PASSWORD = "0652676b73a14c9e162246927f4e74a20ade172ac5623f7f18c76e0130820a62";

if(document.title === "Welcome to Vinnie's World!"){
    async function checkPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    document.getElementById("enter").addEventListener("click", async function () {
        let pass = window.prompt("Enter password");
        while(await checkPassword(pass) !== CORRECT_PASSWORD.toString()){
            pass = window.prompt("Incorrect password. Re-enter password");
        }
        sessionStorage.setItem("authenticated", true);
        location.href = "islands.html";
    });
}

if(document.title === "Oto Island") {
    const control_button = document.getElementById('control_transcription');
    control_button.addEventListener('click', function () {
        if(control_button.innerHTML === 'START'){
            control_button.innerHTML = 'STOP';

            recognition.start(); // start listening
            
            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                document.getElementById("transcript_label").innerHTML += transcript + ".<br><br>";
            };

            recognition.onerror = (event) => {
                console.error("Error: ", event.error);
                control_button.innerHTML = 'START';
            }
        }
        else {
            control_button.innerHTML = 'START';

            recognition.stop();
            // pull transcript
            let transcript = document.getElementById("transcript_label").innerHTML;

            // pull and clean transcript
            transcript = transcript.replaceAll("<br>", "\n");

            const blob = new Blob([transcript], {type: 'text/plain'});
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.style.display = 'none';
            link.href = url;
            link.download = "oto_island_transcript.txt";

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            }
    });
}

if(document.title === "Krono Island"){
    const doc_id = "1otblKZww2cdZlii2ZEv0Ajwdq6i8qFbnDzZmXPvEuj8";
    const url = `https://docs.google.com/spreadsheets/d/${doc_id}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response failed');
        }
        const textData = await response.text();

        let plans_info = "";

        const lines = textData.trim().replaceAll("\"", "").split("\n");
        
        const result = lines.slice(1).map(line => {
            const [name, date, description] = line.split(',');
            plans_info += 
            `<div class="plan_div">
                <div class="plan_info">
                    <h2>${name}</h2>
                    <h3>${date}</h3>
                </div>
                <div class="plan_description">
                    <p>${description}</p>
                </div>
            </div>
            `
        });

        document.getElementById("current_calendar").innerHTML = plans_info;
    }
    catch (error) {
        console.error('Error fetching Doc:', error);
    }
    
    document.getElementById("add_to_planner").addEventListener("submit", async function (event) {
        if(confirm("Add Plan to Calendar?")){
            const data = {
                Name: document.getElementById('plan_name').value,
                Date: document.getElementById('plan_date').value,
                Description: document.getElementById('plan_description').value
            };

            fetch('https://api.sheetmonkey.io/form/3JSfUG3oK6YNgn3yZBEcF6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).then((result) => {
                document.getElementById("add_to_planner").reset();
                location.href = "krono_island.html";
            });
            
        }
    });
}

if(document.title === "Isla Dinero"){
    // --- Application State ---
    const STARTING_CASH = 100000;
    let portfolio = {
        cash: STARTING_CASH,
        positions: {} // Format: { TICKER: { shares: X, avgCost: Y } }
    };

    if(sessionStorage.getItem("portfolio_store") !== null){
        portfolio = JSON.parse(sessionStorage.getItem("portfolio_store"));
    }

    console.log(portfolio);

    // Asset Configuration & Price Simulation baselines
    const assets = {
        AAPL: { price: 150.00, history: [], volatility: 0.0015 },
        TSLA: { price: 220.00, history: [], volatility: 0.0035 },
        BTC: { price: 65000.00, history: [], volatility: 0.0060 },
        GOLD: { price: 2300.00, history: [], volatility: 0.0008 }
    };

    let activeAsset = 'AAPL';
    const maxHistoryPoints = 50;

    // --- HTML Element Selectors ---
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');
    const assetSelect = document.getElementById('asset-select');
    const priceDisplay = document.getElementById('current-price-display');
    const chartTitle = document.getElementById('chart-title');
    const cashDisplay = document.getElementById('cash');
    const netWorthDisplay = document.getElementById('net-worth');
    const returnDisplay = document.getElementById('total-return');
    const portfolioBody = document.getElementById('portfolio-body');
    const sharesInput = document.getElementById('shares-input');
    const btnBuy = document.getElementById('btn-buy');
    const btnSell = document.getElementById('btn-sell');

    // --- Core Simulation Logic ---

    // Seed initial historical data points for the assets
    function initPrices() {
        for (let key in assets) {
            let currentPrice = assets[key].price;
            for (let i = 0; i < maxHistoryPoints; i++) {
                let changePercent = (Math.random() - 0.5) * 2 * assets[key].volatility;
                currentPrice = currentPrice * (1 + changePercent);
                assets[key].history.push(currentPrice);
            }
            assets[key].price = currentPrice;
        }
    }

    // Tick function running continuously to simulate market fluctuation
    function updateMarketPrices() {
        for (let key in assets) {
            let changePercent = (Math.random() - 0.49) * 2 * assets[key].volatility; // slight positive drift
            assets[key].price = assets[key].price * (1 + changePercent);

            assets[key].history.push(assets[key].price);
            if (assets[key].history.length > maxHistoryPoints) {
                assets[key].history.shift();
            }
        }
        drawChart();
    }

    // --- Order Execution Engine ---
    function executeTrade(type) {
        const qty = parseInt(sharesInput.value);
        if (isNaN(qty) || qty <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        const currentPrice = assets[activeAsset].price;
        const totalCost = currentPrice * qty;

        if (type === 'BUY') {
            if (portfolio.cash < totalCost) {
                alert("Insufficient cash funds to complete this purchase.");
                return;
            }
            portfolio.cash -= totalCost;

            if (!portfolio.positions[activeAsset]) {
                portfolio.positions[activeAsset] = { shares: 0, avgCost: 0 };
            }

            let pos = portfolio.positions[activeAsset];
            let newTotalShares = pos.shares + qty;
            pos.avgCost = ((pos.avgCost * pos.shares) + totalCost) / newTotalShares;
            pos.shares = newTotalShares;

        } else if (type === 'SELL') {
            if (!portfolio.positions[activeAsset] || portfolio.positions[activeAsset].shares < qty) {
                alert("You do not own enough shares to sell this asset quantity.");
                return;
            }

            portfolio.cash += totalCost;
            portfolio.positions[activeAsset].shares -= qty;

            if (portfolio.positions[activeAsset].shares === 0) {
                delete portfolio.positions[activeAsset];
            }
        }
        updatePositions();
        drawChart();
    }

    // --- UI Update & Chart Rendering Functions ---
    function updatePositions() {
        // 1. Current Asset Readouts
        const livePrice = assets[activeAsset].price;
        priceDisplay.textContent = `$${livePrice.toFixed(2)}`;
        chartTitle.textContent = `${activeAsset} Live Price`;

        // 2. Financial Aggregates
        let liquidHoldingsValue = 0;
        for (let key in portfolio.positions) {
            liquidHoldingsValue += portfolio.positions[key].shares * assets[key].price;
        }
        const netWorth = portfolio.cash + liquidHoldingsValue;
        const totalReturnPct = ((netWorth - STARTING_CASH) / STARTING_CASH) * 100;

        cashDisplay.textContent = `$${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        netWorthDisplay.textContent = `$${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        returnDisplay.textContent = `${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}%`;
        returnDisplay.className = `stat-val ${totalReturnPct >= 0 ? 'up' : 'down'}`;

        // 3. Render Positions Table
        if(sessionStorage.getItem("portfolio") !== null){
            let display = sessionStorage.getItem("portfolio");
            display = display.substring(display.lastIndexOf("</tr>"));
            portfolioBody.innerHTML = display;
        }

        for (let key in portfolio.positions) {
            const pos = portfolio.positions[key];
            const curPrice = assets[key].price;
            const currentVal = pos.shares * curPrice;
            const pnl = currentVal - (pos.shares * pos.avgCost);

            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${key}</td>
            <td>${pos.shares}</td>
            <td>$${pos.avgCost.toFixed(2)}</td>
            <td>$${curPrice.toFixed(2)}</td>
            <td>$${currentVal.toFixed(2)}</td>
            <td class="${pnl >= 0 ? 'up' : 'down'}">$${pnl.toFixed(2)}</td>
        `;
            portfolioBody.appendChild(row);
        }
        
        sessionStorage.setItem("portfolio", portfolioBody.innerHTML);   
        sessionStorage.setItem("portfolio_store", JSON.stringify(portfolio)); 
    }

    // Manual Canvas Line Chart Generation
    function drawChart() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        const history = assets[activeAsset].history;
        if (history.length < 2) return;

        const minPrice = Math.min(...history) * 0.999;
        const maxPrice = Math.max(...history) * 1.001;
        const priceRange = maxPrice - minPrice;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isUp = history[history.length - 1] >= history[0];
        ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
            const x = (i / (maxHistoryPoints - 1)) * canvas.width;
            const y = canvas.height - ((history[i] - minPrice) / priceRange) * canvas.height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        ctx.lineTo((history.length - 1) / (maxHistoryPoints - 1) * canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // --- Interactive Event Listeners ---
    assetSelect.addEventListener('change', (e) => {
        activeAsset = e.target.value;
        drawChart();
    });

    btnBuy.addEventListener('click', () => executeTrade('BUY'));
    btnSell.addEventListener('click', () => executeTrade('SELL'));
    window.addEventListener('resize', drawChart);

    document.getElementById("btn-reset").addEventListener("click", function(){
        if(confirm("Reset Portfolio?")){
            sessionStorage.removeItem("portfolio");
            sessionStorage.removeItem("portfolio_store");
            location.reload();
        }
    });

    // --- Initialization Execution ---
    initPrices();
    drawChart();
    updatePositions();
    setInterval(updateMarketPrices, 1000);
}