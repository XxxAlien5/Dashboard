// Storage keys - MATCH products.js
const STORAGE_KEYS = {
    PRODUCTS: 'products',  // Changed from 'issou_products' to match products.js
    ORDERS: 'issou_orders'
};

// Initialize data from localStorage or empty arrays
let products = [];
let orders = [];

function loadData() {
    const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    
    products = storedProducts ? JSON.parse(storedProducts) : [];
    orders = storedOrders ? JSON.parse(storedOrders) : [];
}

function saveProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function saveOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

function getCurrentYearMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthlyAddedProducts() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return products.filter(p => {
        // Try multiple date fields
        const dateStr = p.addedDate || p.updated || p.createdAt || '';
        
        if (!dateStr) return false;
        
        // Handle different date formats
        let date;
        if (dateStr.includes('/')) {
            // Format: MM/DD/YYYY or DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // Try to parse - assuming MM/DD/YYYY or DD/MM/YYYY
                const month = parseInt(parts[0]) - 1;
                const year = parseInt(parts[2]);
                date = new Date(year, month, 1);
            }
        } else if (dateStr.includes('-')) {
            // Format: YYYY-MM-DD
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            }
        } else {
            // Try direct parsing
            date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) return false;
        
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
}

function getCompletedOrders() {
    return orders.filter(o => o.status === "completed").length;
}

function getMonthlySales() {
    const currentMonth = getCurrentYearMonth();
    return orders.filter(o => o.status === "completed" && o.orderDate && o.orderDate.startsWith(currentMonth))
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
}

function updateDashboardStats() {
    const totalProductsEl = document.getElementById('totalProducts');
    const monthlyAddedEl = document.getElementById('monthlyAdded');
    const ordersReceivedEl = document.getElementById('ordersReceived');
    const ordersProcessedEl = document.getElementById('ordersProcessed');
    const monthlySalesEl = document.getElementById('monthlySales');
    
    // Force reload data to get latest from localStorage
    loadData();
    
    if (totalProductsEl) totalProductsEl.textContent = products.length;
    if (monthlyAddedEl) monthlyAddedEl.textContent = getMonthlyAddedProducts();
    if (ordersReceivedEl) ordersReceivedEl.textContent = orders.length;
    if (ordersProcessedEl) ordersProcessedEl.textContent = getCompletedOrders();
    if (monthlySalesEl) monthlySalesEl.textContent = getMonthlySales().toLocaleString() + " DZD";
}

function loadRecentOrders() {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;
    
    // Force reload data
    loadData();
    
    const recentOrders = [...orders].slice(0, 5);
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No orders yet. Orders will appear here once placed.</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => `
        <tr>
            <td>${escapeHtml(order.name || order.customerName || 'N/A')}</td>
            <td>${escapeHtml(order.product || order.productName || 'N/A')}</td>
            <td>${(order.totalPrice || 0).toLocaleString()} DZD</td>
            <td><span class="status-badge ${order.status === 'completed' ? 'status-completed' : 'status-pending'}">${order.status === 'completed' ? 'Completed' : 'Pending'}</span></td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) document.body.removeChild(notification);
        }, 300);
    }, 2500);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                showNotification('Logged out successfully', 'info');
                setTimeout(() => alert('Demo: You have been logged out.'), 500);
            }
        });
    }
}

function setupNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const buttons = document.querySelectorAll('nav button');
    buttons.forEach(btn => {
        const link = btn.querySelector('a');
        if (link && link.getAttribute('href') === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Add CSS animations if not already present
function addStyles() {
    if (!document.getElementById('dashboard-styles')) {
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .status-completed {
                background-color: #dcfce7;
                color: #166534;
            }
            .status-pending {
                background-color: #fef9c3;
                color: #854d0e;
            }
        `;
        document.head.appendChild(style);
    }
}

// Listen for storage changes from other tabs/windows
window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEYS.PRODUCTS || e.key === STORAGE_KEYS.ORDERS) {
        loadData();
        updateDashboardStats();
        loadRecentOrders();
    }
});

function init() {
    addStyles();
    loadData();
    updateDashboardStats();
    loadRecentOrders();
    setupLogout();
    setupNavigation();
}

document.addEventListener('DOMContentLoaded', init);