const puppeteer = require('puppeteer');

(async () => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    </head>
    <body>
        <div id="chart"></div>
        <script>
            const isHorizontal = false;
            const options = {
                chart: {
                    type: 'bar',
                    stacked: isHorizontal, 
                    toolbar: { show: true },
                    zoom: { enabled: true },
                    animations: { enabled: false }
                },
                series: [
                    {
                        name: '2023',
                        data: [
                            { x: 'Cat 1', y: 10 },
                            { x: 'Cat 2', y: 20 }
                        ]
                    }
                ],
                plotOptions: {
                    bar: {
                        horizontal: isHorizontal,
                        barHeight: '70%',
                        borderRadius: 4,
                    },
                },
                xaxis: {
                    type: 'category',
                    labels: {
                        style: {
                            colors: '#9aa0ac',
                            fontSize: '12px'
                        }
                    }
                },
                yaxis: {
                    title: {
                        text: isHorizontal ? undefined : 'Valores'
                    },
                    labels: {
                        style: {
                            fontSize: '11px',
                        },
                        maxWidth: isHorizontal ? 300 : undefined
                    }
                }
            };
            
            try {
                const chart = new ApexCharts(document.querySelector("#chart"), options);
                chart.render();
                console.log("RENDER_SUCCESS");
            } catch (e) {
                console.log("RENDER_ERROR: " + e.message);
            }
        </script>
    </body>
    </html>
    `;

    const fs = require('fs');
    fs.writeFileSync('test_chart.html', html);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('file://' + process.cwd() + '/test_chart.html');
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
