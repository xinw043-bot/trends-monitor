// 颜色 palette
const COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384'
];

// 初始化图表
let trendsChart;
const ctx = document.getElementById('trendsChart').getContext('2d');

// 获取数据并渲染
async function loadData() {
    const errorMsg = document.getElementById('errorMsg');
    const metaDiv = document.getElementById('meta');
    errorMsg.textContent = '';
    metaDiv.textContent = 'Loading data...';

    try {
        // 请求 Serverless 函数
        const response = await fetch('/api/fetch_trends?t=' + Date.now());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // 更新元数据
        metaDiv.innerHTML = `
            Last Updated: ${data.meta.last_updated} | 
            Total Entries: ${data.meta.total_keywords} | 
            Errors: ${data.meta.errors}
        `;

        // 渲染图表和表格
        renderChart(data);
        renderTable(data);

    } catch (err) {
        errorMsg.textContent = `Error: ${err.message}`;
        console.error('Load data error:', err);
    }
}

// 渲染图表
function renderChart(data) {
    const datasets = [];
    let index = 0;

    // 处理每个关键词-国家组合
    for (const [key, value] of Object.entries(data.keywords)) {
        if (value.error) continue;

        // 提取趋势数据（根据 SerpAPI 返回结构调整）
        const timelineData = value.interest_over_time?.timeline_data || [];
        const values = timelineData.map(item => item.value[0]);
        const labels = timelineData.map(item => item.formatted_time);

        datasets.push({
            label: key,
            data: values,
            borderColor: COLORS[index % COLORS.length],
            backgroundColor: `${COLORS[index % COLORS.length]}33`, // 透明色
            borderWidth: 2,
            fill: false,
            tension: 0.1
        });
        index++;
    }

    // 销毁旧图表（避免重复渲染）
    if (trendsChart) trendsChart.destroy();

    // 创建新图表
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels || [],
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Interest' } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });
}

// 渲染数据表格
function renderTable(data) {
    const container = document.getElementById('tableContainer');
    let html = '<table><thead><tr><th>Keyword_Country</th><th>Status</th><th>Latest Value</th></tr></thead><tbody>';

    for (const [key, value] of Object.entries(data.keywords)) {
        const status = value.error ? 'Error' : 'OK';
        const latestValue = value.interest_over_time?.timeline_data?.slice(-1)[0]?.value[0] || '-';
        
        html += `<tr>
            <td>${key}</td>
            <td>${status}</td>
            <td>${latestValue}</td>
        </tr>`;
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('refreshBtn').addEventListener('click', loadData);
});